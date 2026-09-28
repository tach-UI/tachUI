/**
 * The adapters composed with tachUI components, over the router fixture: a
 * query feeding List rows and refreshed through List's `onRefresh`, a Form
 * whose submission the application maps to a mutation request, and a server
 * stream feeding List through `createConnectStreamList`.
 *
 * Each composition is the application's code, written as an application would
 * write it. What is checked is the rendered DOM, so a signal that changed
 * without the view following it fails here.
 */

import { Code, ConnectError } from '@connectrpc/connect'
import { createEffect, createMemo, h, renderComponent } from '@tachui/core'
import type { ComponentInstance } from '@tachui/core'
// The `./list` entry: the root declarations re-export `./list`, which a
// case-insensitive file system resolves to the `List.js` chunk beside it.
import { List } from '@tachui/data/list'
import { form } from '@tachui/forms'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createConnectMutation } from '../src/mutation'
import { createConnectQuery } from '../src/query'
import { createConnectStreamList } from '../src/stream'
import { UserService } from './fixtures/generated'
import type { User } from './fixtures/generated'
import { disposeScopes, scope, settle } from './support/harness'
import { aborted, hold, userRouter } from './support/router'

const { listUsers, updateUser, watchUsers } = UserService.method

const mounted: (() => void)[] = []

afterEach(() => {
  for (const unmount of mounted.splice(0)) {
    unmount()
  }
  disposeScopes()
  document.body.innerHTML = ''
})

/** One List row showing `text`. */
function row(text: string): ComponentInstance {
  return {
    type: 'component',
    id: `row-${text}`,
    props: {},
    cleanup: [],
    mounted: false,
    render: () => [h('span', { class: 'row' }, text)],
  } as unknown as ComponentInstance
}

/** Renders `component` into a fresh container, re-rendering as its signals change. */
function render(component: unknown): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  mounted.push(renderComponent(component as ComponentInstance, container))
  return container
}

function rowsOf(container: HTMLElement): (string | null)[] {
  return Array.from(container.querySelectorAll('.row'), element => element.textContent)
}

describe('a Connect query feeding List', () => {
  it('renders the response as rows, and a refresh through onRefresh re-renders them', async () => {
    const server = userRouter()
    const root = scope({ default: server.transport })

    const { value: view } = root.mount(() => {
      const query = createConnectQuery(listUsers, () => ({}))
      const names = createMemo(() => query.data()?.names ?? [])
      const onRefresh = vi.fn(async () => {
        await query.refetch()
      })
      const list = List<string>({
        data: names,
        getItemId: name => name,
        renderItem: name => row(name),
        onRefresh,
      })
      return { list, onRefresh }
    })
    const container = render(view.list)
    await settle()
    expect(rowsOf(container)).toEqual(['Ada', 'Grace'])

    server.users.set(3n, 'Hedy')
    // The callback the List was given is the one a refresh gesture invokes.
    const refresh = (view.list as unknown as { props: { onRefresh: () => Promise<void> } })
      .props.onRefresh
    expect(refresh).toBe(view.onRefresh)
    await refresh()
    await settle()

    expect(view.onRefresh).toHaveBeenCalledTimes(1)
    expect(server.handledBy('listUsers')).toHaveLength(2)
    expect(rowsOf(container)).toEqual(['Ada', 'Grace', 'Hedy'])
  })
})

describe('a Form submitting a Connect mutation', () => {
  function mountForm(fail: boolean) {
    const reply = hold()
    const server = userRouter({
      handlers: {
        updateUser: async ({ name }) => {
          await reply.promise
          if (fail) {
            throw new ConnectError('that name is taken', Code.AlreadyExists)
          }
          return { name }
        },
      },
    })
    const root = scope({ default: server.transport })
    const status = document.createElement('output')
    status.className = 'status'
    const problem = document.createElement('output')
    problem.className = 'problem'

    const { value: profile } = root.mount(() => {
      const mutation = createConnectMutation(updateUser)
      // Elements bound to the mutation's result, not to the Form's own state.
      createEffect(() => {
        status.textContent = mutation.isPending()
          ? 'saving'
          : (mutation.data()?.name ?? 'idle')
      })
      createEffect(() => {
        const error = mutation.error()
        problem.textContent =
          error instanceof ConnectError ? `${Code[error.code]}: ${error.rawMessage}` : ''
      })
      return form({
        initialValues: { id: '4', displayName: 'Katherine' },
        // The application maps form values to the generated request itself.
        onSubmit: async (values: Record<string, string>) => {
          await mutation
            .mutate({ id: BigInt(values.id), name: values.displayName })
            .catch(() => undefined)
        },
        children: [status, problem],
      })
    })
    const element = profile.render()
    document.body.appendChild(element)
    return { server, reply, element, status, problem }
  }

  function submit(element: HTMLElement): void {
    element.dispatchEvent(new Event('submit', { cancelable: true }))
  }

  it('sends the mapped request, and shows pending until the reply', async () => {
    const { server, reply, element, status, problem } = mountForm(false)
    expect(status.textContent).toBe('idle')

    submit(element)
    await vi.waitFor(() => expect(server.handledBy('updateUser')).toHaveLength(1))

    expect(status.textContent).toBe('saving')
    expect(server.handledBy('updateUser')[0].request).toEqual(
      expect.objectContaining({ id: 4n, name: 'Katherine' })
    )
    reply.release()
    await vi.waitFor(() => expect(status.textContent).toBe('Katherine'))
    expect(problem.textContent).toBe('')
  })

  it('shows pending, then the ConnectError, when the mutation fails', async () => {
    const { server, reply, element, status, problem } = mountForm(true)

    submit(element)
    await vi.waitFor(() => expect(server.handledBy('updateUser')).toHaveLength(1))
    expect(status.textContent).toBe('saving')
    expect(problem.textContent).toBe('')

    reply.release()
    await vi.waitFor(() => expect(problem.textContent).toBe('AlreadyExists: that name is taken'))
    expect(status.textContent).toBe('idle')
  })
})

describe('a server stream feeding List through createConnectStreamList', () => {
  it('adds ordered rows, updates a repeated key in place, and stops changing once cancelled', async () => {
    const queue: string[] = []
    let wake: (() => void) | undefined
    function send(name: string): void {
      queue.push(name)
      wake?.()
    }
    const server = userRouter({
      handlers: {
        watchUsers: async function* (_request, context) {
          for (;;) {
            const name = queue.shift()
            if (name !== undefined) {
              yield { name }
              continue
            }
            const next = new Promise<void>(resolve => {
              wake = resolve
            })
            await Promise.race([next, aborted(context.signal)])
            if (context.signal.aborted && queue.length === 0) {
              return
            }
          }
        },
      },
    })
    const root = scope({ default: server.transport })

    const { value: view } = root.mount(() => {
      const feed = createConnectStreamList(watchUsers, () => ({}), {
        // `ada:online` and `ada:away` are one person's row.
        itemKey: (message: User) => message.name.split(':')[0],
      })
      const rows = createMemo(() =>
        feed.ids().map(id => feed.get(id)()?.name ?? '')
      )
      const list = List<string>({
        data: rows,
        getItemId: (_name, index) => index,
        renderItem: name => row(name),
      })
      return { feed, list }
    })
    const container = render(view.list)
    expect(rowsOf(container)).toEqual([])

    send('ada:online')
    send('grace:online')
    await vi.waitFor(() => expect(rowsOf(container)).toEqual(['ada:online', 'grace:online']))

    send('ada:away')
    await vi.waitFor(() => expect(rowsOf(container)).toEqual(['ada:away', 'grace:online']))

    send('hedy:online')
    await vi.waitFor(() =>
      expect(rowsOf(container)).toEqual(['ada:away', 'grace:online', 'hedy:online'])
    )

    view.feed.cancel()
    expect(view.feed.status()).toBe('cancelled')
    send('katherine:online')
    send('ada:offline')
    await settle()
    await settle()

    expect(rowsOf(container)).toEqual(['ada:away', 'grace:online', 'hedy:online'])
  })

  it('stops changing the rows once its owner is disposed', async () => {
    const late = hold()
    const server = userRouter({
      handlers: {
        watchUsers: async function* (_request, context) {
          yield { name: 'ada' }
          await aborted(context.signal)
          await late.promise
          yield { name: 'grace' }
        },
      },
    })
    const root = scope({ default: server.transport })

    const { value: view, dispose } = root.mount(() => {
      const feed = createConnectStreamList(watchUsers, () => ({}), {
        itemKey: (message: User) => message.name,
      })
      const rows = createMemo(() => feed.ids().map(id => feed.get(id)()?.name ?? ''))
      return {
        list: List<string>({
          data: rows,
          getItemId: name => name,
          renderItem: name => row(name),
        }),
      }
    })
    const container = render(view.list)
    await vi.waitFor(() => expect(rowsOf(container)).toEqual(['ada']))

    dispose()
    await vi.waitFor(() =>
      expect(server.handledBy('watchUsers')[0].signal.aborted).toBe(true)
    )
    late.release()
    await settle()
    await settle()

    expect(rowsOf(container)).toEqual(['ada'])
  })
})
