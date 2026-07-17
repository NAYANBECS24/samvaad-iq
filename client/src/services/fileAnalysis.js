const ACCEPTED = new Set(['pdf', 'docx', 'xlsx', 'csv', 'json', 'png', 'jpg', 'jpeg'])
const MAX_BYTES = 10 * 1024 * 1024

function extension(name = '') {
  return name.toLowerCase().split('.').pop()
}

async function sha256(file) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

async function extractPdf(file) {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const pages = []
  for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 50); pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => item.str).join(' '))
  }
  return { text: pages.join('\n'), limitations: document.numPages > 50 ? ['Only the first 50 PDF pages were analyzed.'] : [] }
}

async function extractDocx(file) {
  const mammoth = await import('mammoth/mammoth.browser')
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return { text: result.value, limitations: result.messages.map((message) => message.message) }
}

async function extractWorkbook(file) {
  const { default: readXlsxFile } = await import('read-excel-file/browser')
  const rows = await readXlsxFile(file)
  const text = rows.map((row) => row.map((value) => typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')).join(',')).join('\n')
  return { text, limitations: ['The browser parser analyzed the first worksheet only.'] }
}

async function imageMetadata(file) {
  const url = URL.createObjectURL(file)
  try {
    const dimensions = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(`${image.naturalWidth} × ${image.naturalHeight}`)
      image.onerror = () => reject(new Error('The image could not be decoded.'))
      image.src = url
    })
    return { text: `Image evidence metadata: ${file.name}; dimensions ${dimensions}.`, limitations: ['OCR is unavailable unless the live Catalyst Zia capability is enabled; no text was inferred from pixels.'] }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function prepareEvidenceFile(file) {
  const ext = extension(file.name)
  if (!ACCEPTED.has(ext)) throw new Error('Supported formats: PDF, DOCX, XLSX, CSV, JSON, PNG, JPG, and JPEG.')
  if (!file.size) throw new Error('The selected file is empty.')
  if (file.size > MAX_BYTES) throw new Error('The selected file exceeds the 10 MB evidence limit.')

  let extracted
  if (ext === 'pdf') extracted = await extractPdf(file)
  else if (ext === 'docx') extracted = await extractDocx(file)
  else if (ext === 'xlsx') extracted = await extractWorkbook(file)
  else if (['png', 'jpg', 'jpeg'].includes(ext)) extracted = await imageMetadata(file)
  else {
    const text = await file.text()
    if (ext === 'json') JSON.parse(text)
    extracted = { text, limitations: [] }
  }

  return {
    text: extracted.text.slice(0, 200000),
    file: {
      name: file.name,
      type: file.type || `application/${ext}`,
      size: file.size,
      sha256: await sha256(file),
      lastModified: new Date(file.lastModified).toISOString(),
    },
    limitations: extracted.limitations,
  }
}
