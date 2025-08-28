// TachUI Browser Benchmark Suite
// Real-world performance testing in actual browser environment

class BrowserBenchmarkRunner {
  constructor() {
    this.results = []
    this.isRunning = false
    this.data = this.generateData(1000)
    this.selectedId = null

    this.tbody = document.getElementById('tbody')
    this.statusDiv = document.getElementById('status')
    this.resultsDiv = document.getElementById('results')
    this.outputDiv = document.getElementById('benchmark-output')

    this.setupEventListeners()

    // Expose to window for Playwright
    window.benchmarkRunner = this
  }

  generateData(count) {
    const adjectives = [
      'pretty',
      'large',
      'big',
      'small',
      'tall',
      'short',
      'long',
      'handsome',
      'plain',
      'quaint',
    ]
    const colours = [
      'red',
      'yellow',
      'blue',
      'green',
      'pink',
      'brown',
      'purple',
      'white',
      'black',
      'orange',
    ]
    const nouns = [
      'table',
      'chair',
      'house',
      'bbq',
      'desk',
      'car',
      'pony',
      'cookie',
      'sandwich',
      'burger',
    ]

    const data = []
    for (let i = 0; i < count; i++) {
      data.push({
        id: i + 1,
        label: `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${colours[Math.floor(Math.random() * colours.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`,
      })
    }
    return data
  }

  async measurePerformance(name, fn) {
    if (this.isRunning) return null

    this.setStatus(`Running: ${name}...`, 'info')
    this.isRunning = true

    // Force garbage collection if available
    if (window.gc) {
      window.gc()
    }

    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0
    const startTime = performance.now()

    try {
      await fn()

      const endTime = performance.now()
      const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0

      const duration = endTime - startTime
      const memoryDelta = endMemory - startMemory
      const operationsPerSecond = Math.round((1000 / duration) * 100)

      const result = {
        name,
        duration: Math.round(duration * 100) / 100,
        memory: Math.round((memoryDelta / 1024 / 1024) * 100) / 100,
        operationsPerSecond,
        timestamp: new Date().toISOString(),
      }

      this.results.push(result)
      this.updateResults()
      this.setStatus(
        `✅ ${name}: ${result.duration}ms (${result.operationsPerSecond} ops/sec)`,
        'success'
      )

      return result
    } catch (error) {
      this.setStatus(`❌ ${name} failed: ${error.message}`, 'error')
      throw error
    } finally {
      this.isRunning = false
    }
  }

  setStatus(message, type = 'info') {
    this.statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`
  }

  updateResults() {
    if (this.results.length === 0) return

    this.resultsDiv.style.display = 'block'

    const latest = this.results[this.results.length - 1]
    const html = `
      <h4>Latest Result: ${latest.name}</h4>
      <p><strong>Duration:</strong> ${latest.duration}ms</p>
      <p><strong>Memory:</strong> ${latest.memory}MB</p>
      <p><strong>Ops/sec:</strong> ${latest.operationsPerSecond}</p>
      
      <h4>All Results (${this.results.length} tests)</h4>
      <table style="width: 100%; font-size: 12px;">
        <thead>
          <tr>
            <th>Test</th>
            <th>Duration (ms)</th>
            <th>Memory (MB)</th>
            <th>Ops/sec</th>
          </tr>
        </thead>
        <tbody>
          ${this.results
            .map(
              (r) => `
            <tr>
              <td>${r.name}</td>
              <td>${r.duration}</td>
              <td>${r.memory}</td>
              <td>${r.operationsPerSecond}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `

    this.outputDiv.innerHTML = html
  }

  createRow(item) {
    const tr = document.createElement('tr')
    tr.setAttribute('data-id', item.id)
    if (this.selectedId === item.id) {
      tr.classList.add('selected')
    }

    tr.innerHTML = `
      <td class="col-md-1">${item.id}</td>
      <td class="col-md-4"><a href="#">${item.label}</a></td>
      <td class="col-md-1">
        <button class="btn btn-sm btn-danger" data-action="remove" data-id="${item.id}">x</button>
      </td>
      <td class="col-md-6"></td>
    `

    // Add click handler for selection
    tr.addEventListener('click', (e) => {
      if (e.target.getAttribute('data-action') !== 'remove') {
        this.selectRow(item.id)
      }
    })

    // Add remove handler
    const removeBtn = tr.querySelector('[data-action="remove"]')
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.removeRow(item.id)
    })

    return tr
  }

  selectRow(id) {
    // Remove previous selection
    const selected = this.tbody.querySelector('.selected')
    if (selected) {
      selected.classList.remove('selected')
    }

    // Add new selection
    const row = this.tbody.querySelector(`[data-id="${id}"]`)
    if (row) {
      row.classList.add('selected')
      this.selectedId = id
    }
  }

  removeRow(id) {
    const row = this.tbody.querySelector(`[data-id="${id}"]`)
    if (row) {
      row.remove()
      this.data = this.data.filter((item) => item.id !== id)
    }
  }

  // Benchmark Methods
  async createRows() {
    return this.measurePerformance('Create 1,000 rows', async () => {
      this.tbody.innerHTML = ''
      const fragment = document.createDocumentFragment()

      this.data.forEach((item) => {
        fragment.appendChild(this.createRow(item))
      })

      this.tbody.appendChild(fragment)
    })
  }

  async replaceAllRows() {
    return this.measurePerformance('Replace all 1,000 rows', async () => {
      this.data = this.generateData(1000)
      this.tbody.innerHTML = ''
      const fragment = document.createDocumentFragment()

      this.data.forEach((item) => {
        fragment.appendChild(this.createRow(item))
      })

      this.tbody.appendChild(fragment)
    })
  }

  async updateEvery10thRow() {
    // Ensure we have rows to update
    if (this.tbody.querySelectorAll('tr').length === 0) {
      if (this.data.length === 0) {
        this.data = this.generateData(1000)
      }
      // Create rows without timing measurement
      this.tbody.innerHTML = ''
      const fragment = document.createDocumentFragment()
      this.data.forEach((item) => {
        fragment.appendChild(this.createRow(item))
      })
      this.tbody.appendChild(fragment)
    }

    return this.measurePerformance('Update every 10th row', async () => {
      const rows = this.tbody.querySelectorAll('tr')
      for (let i = 0; i < rows.length; i += 10) {
        const row = rows[i]
        const link = row.querySelector('a')
        if (link) {
          link.textContent += ' !!!'
        }
      }
    })
  }

  async selectSingleRow() {
    // Ensure we have data and rows
    if (this.data.length === 0 || this.tbody.querySelectorAll('tr').length === 0) {
      this.data = this.generateData(1000)
      this.tbody.innerHTML = ''
      const fragment = document.createDocumentFragment()
      this.data.forEach((item) => {
        fragment.appendChild(this.createRow(item))
      })
      this.tbody.appendChild(fragment)
    }

    return this.measurePerformance('Select row', async () => {
      const middleIndex = Math.floor(this.data.length / 2)
      const targetId = this.data[middleIndex]?.id
      if (targetId) {
        this.selectRow(targetId)
      }
    })
  }

  async swapRows() {
    // Ensure we have enough rows
    if (this.tbody.querySelectorAll('tr').length < 2) {
      if (this.data.length === 0) {
        this.data = this.generateData(1000)
      }
      this.tbody.innerHTML = ''
      const fragment = document.createDocumentFragment()
      this.data.forEach((item) => {
        fragment.appendChild(this.createRow(item))
      })
      this.tbody.appendChild(fragment)
    }

    return this.measurePerformance('Swap rows', async () => {
      const rows = Array.from(this.tbody.querySelectorAll('tr'))

      if (rows.length >= 2) {
        const row1 = rows[1]
        const row2 = rows[rows.length - 2]

        // Swap in DOM
        const tempNode = document.createTextNode('')
        row1.parentNode.insertBefore(tempNode, row1)
        row2.parentNode.insertBefore(row1, row2)
        tempNode.parentNode.insertBefore(row2, tempNode)
        tempNode.remove()

        // Swap in data
        const data1 = this.data[1]
        const data2 = this.data[this.data.length - 2]
        this.data[1] = data2
        this.data[this.data.length - 2] = data1
      }
    })
  }

  async removeEvery10thRow() {
    // Ensure we have rows to remove
    if (this.tbody.querySelectorAll('tr').length === 0) {
      if (this.data.length === 0) {
        this.data = this.generateData(1000)
      }
      this.tbody.innerHTML = ''
      const fragment = document.createDocumentFragment()
      this.data.forEach((item) => {
        fragment.appendChild(this.createRow(item))
      })
      this.tbody.appendChild(fragment)
    }

    return this.measurePerformance('Remove every 10th row', async () => {
      const rows = Array.from(this.tbody.querySelectorAll('tr'))

      // Remove in reverse order to avoid index issues
      for (let i = rows.length - 1; i >= 0; i -= 10) {
        const row = rows[i]
        const id = parseInt(row.getAttribute('data-id'))
        this.removeRow(id)
      }
    })
  }

  async clearAllRows() {
    return this.measurePerformance('Clear all rows', async () => {
      this.tbody.innerHTML = ''
      this.data = []
      this.selectedId = null
    })
  }

  async componentCreationTest() {
    return this.measurePerformance('Component creation (1,000 components)', async () => {
      const container = document.createElement('div')

      for (let i = 0; i < 1000; i++) {
        const component = document.createElement('div')
        component.className = 'test-component'
        component.innerHTML = `<span>Component ${i}</span><button>Action</button>`
        container.appendChild(component)
      }

      // Clean up
      container.innerHTML = ''
    })
  }

  async runAllBenchmarks() {
    if (this.isRunning) return

    try {
      this.results = [] // Clear previous results
      this.setStatus('Running full benchmark suite...', 'info')

      // Ensure we start with data
      await this.createRows()
      await new Promise((resolve) => setTimeout(resolve, 100))

      await this.replaceAllRows()
      await new Promise((resolve) => setTimeout(resolve, 100))

      await this.updateEvery10thRow()
      await new Promise((resolve) => setTimeout(resolve, 100))

      await this.selectSingleRow()
      await new Promise((resolve) => setTimeout(resolve, 100))

      await this.swapRows()
      await new Promise((resolve) => setTimeout(resolve, 100))

      await this.removeEvery10thRow()
      await new Promise((resolve) => setTimeout(resolve, 100))

      await this.clearAllRows()
      await new Promise((resolve) => setTimeout(resolve, 100))

      await this.componentCreationTest()

      this.setStatus(`✅ All benchmarks completed! ${this.results.length} tests run.`, 'success')

      return this.results
    } catch (error) {
      this.setStatus(`❌ Benchmark suite failed: ${error.message}`, 'error')
      throw error
    }
  }

  setupEventListeners() {
    document.getElementById('create-rows').addEventListener('click', () => this.createRows())
    document.getElementById('replace-rows').addEventListener('click', () => this.replaceAllRows())
    document
      .getElementById('update-rows')
      .addEventListener('click', () => this.updateEvery10thRow())
    document.getElementById('select-row').addEventListener('click', () => this.selectSingleRow())
    document.getElementById('swap-rows').addEventListener('click', () => this.swapRows())
    document
      .getElementById('remove-rows')
      .addEventListener('click', () => this.removeEvery10thRow())
    document.getElementById('clear-rows').addEventListener('click', () => this.clearAllRows())
    document.getElementById('run-all').addEventListener('click', () => this.runAllBenchmarks())
    document
      .getElementById('run-component-test')
      .addEventListener('click', () => this.componentCreationTest())
  }

  // API for Playwright
  getResults() {
    return this.results
  }

  getLatestResult() {
    return this.results[this.results.length - 1]
  }

  clearResults() {
    this.results = []
    this.resultsDiv.style.display = 'none'
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BrowserBenchmarkRunner()
})
