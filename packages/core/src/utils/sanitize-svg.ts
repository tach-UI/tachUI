const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const ALLOWED_TAGS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'rect',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'clippath',
  'mask',
  'symbol',
  'use',
  'lineargradient',
  'radialgradient',
  'stop',
])

const STRIP_SUBTREE_TAGS = new Set(['script', 'foreignobject', 'style'])

const ALLOWED_ATTRIBUTES = new Set([
  'viewbox',
  'd',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'width',
  'height',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'points',
  'transform',
  'opacity',
  'clip-path',
  'mask',
  'filter',
  'gradientunits',
  'gradienttransform',
  'offset',
  'stop-color',
  'stop-opacity',
  'id',
  'class',
  'preserveaspectratio',
  'href',
  'xlink:href',
  'xmlns:xlink',
])

const URL_REFERENCE_ATTRIBUTES = new Set(['filter', 'clip-path', 'mask'])

function stripXMLDeclarations(markup: string): string {
  return markup
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!ENTITY[\s\S]*?>/gi, '')
}

function hasUnsafeProtocol(value: string): boolean {
  const normalized = value
    .toLowerCase()
    .replace(/[\u0000-\u0020]+/g, '')
  return normalized.includes('javascript:') || normalized.includes('data:')
}

function isSafeFragmentHref(value: string): boolean {
  const trimmed = value.trim()
  return /^#[A-Za-z_][\w:.-]*$/.test(trimmed)
}

function isSafeURLReference(value: string): boolean {
  const trimmed = value.trim()
  const match = trimmed.match(/^url\((["']?)(#[A-Za-z_][\w:.-]*)\1\)$/)
  return Boolean(match)
}

function sanitizeAttribute(name: string, value: string): string | undefined {
  const normalizedName = name.toLowerCase()

  if (!ALLOWED_ATTRIBUTES.has(normalizedName)) return undefined
  if (normalizedName.startsWith('on')) return undefined
  if (hasUnsafeProtocol(value)) return undefined

  if (normalizedName === 'href' || normalizedName === 'xlink:href') {
    return isSafeFragmentHref(value) ? value.trim() : undefined
  }

  if (value.includes('url(')) {
    return isSafeURLReference(value) ? value.trim() : undefined
  }

  if (URL_REFERENCE_ATTRIBUTES.has(normalizedName)) {
    return isSafeURLReference(value) ? value.trim() : undefined
  }

  return value
}

function sanitizeElement(
  sourceElement: Element,
  outputDocument: XMLDocument
): Node[] {
  const tag = sourceElement.tagName.toLowerCase()

  if (STRIP_SUBTREE_TAGS.has(tag)) {
    return []
  }

  if (!ALLOWED_TAGS.has(tag)) {
    const sanitizedChildren: Node[] = []
    for (const child of sourceElement.childNodes) {
      sanitizedChildren.push(...sanitizeNode(child, outputDocument))
    }
    return sanitizedChildren
  }

  const sanitized = outputDocument.createElementNS(SVG_NAMESPACE, sourceElement.tagName)

  for (const attribute of sourceElement.getAttributeNames()) {
    const value = sourceElement.getAttribute(attribute)
    if (value === null) continue
    const safeValue = sanitizeAttribute(attribute, value)
    if (safeValue !== undefined) {
      sanitized.setAttribute(attribute, safeValue)
    }
  }

  for (const child of sourceElement.childNodes) {
    const sanitizedChildren = sanitizeNode(child, outputDocument)
    for (const sanitizedChild of sanitizedChildren) {
      sanitized.appendChild(sanitizedChild)
    }
  }

  return [sanitized]
}

function sanitizeNode(node: Node, outputDocument: XMLDocument): Node[] {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return sanitizeElement(node as Element, outputDocument)
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return [outputDocument.createTextNode(node.textContent ?? '')]
  }

  return []
}

export function sanitizeSVG(markup: string): string {
  if (typeof markup !== 'string' || markup.trim() === '') return ''

  const parser = new DOMParser()
  const parsed = parser.parseFromString(stripXMLDeclarations(markup), 'image/svg+xml')

  const root = parsed.documentElement
  if (!root || root.tagName.toLowerCase() !== 'svg') return ''

  const cleanDocument = document.implementation.createDocument(SVG_NAMESPACE, 'svg', null)
  const sanitizedNodes = sanitizeElement(root, cleanDocument)
  const sanitizedRoot = sanitizedNodes.find(
    node => node.nodeType === Node.ELEMENT_NODE
  ) as Element | undefined

  if (!sanitizedRoot || sanitizedRoot.tagName.toLowerCase() !== 'svg') {
    return ''
  }

  cleanDocument.replaceChild(sanitizedRoot, cleanDocument.documentElement)

  return new XMLSerializer().serializeToString(cleanDocument.documentElement)
}
