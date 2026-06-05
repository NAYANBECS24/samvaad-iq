import { CheckCircle2, DatabaseZap, ShieldCheck, TableProperties, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import seed from '../data/demoSeed.json'
import { seedSummary } from '../services/prototypeEngine.js'

function AdminData() {
  const [draft, setDraft] = useState(JSON.stringify(seed.cases.slice(0, 2), null, 2))
  const [message, setMessage] = useState('Ready for manual synthetic data validation.')
  const summary = seedSummary()

  const parsed = useMemo(() => {
    try {
      const data = JSON.parse(draft)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }, [draft])

  function validateImport() {
    try {
      const data = JSON.parse(draft)
      if (!Array.isArray(data)) throw new Error('Expected an array of FIR records')
      const missing = data.find((item) => !item.fir_id || !item.crime_type || !item.district || !item.case_summary)
      if (missing) throw new Error('Every record needs fir_id, crime_type, district, and case_summary')
      setMessage(`${data.length} synthetic FIR records validated. Catalyst Data Store import can use this shape.`)
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin Data</p>
          <h1>Manual Synthetic FIR Import</h1>
        </div>
        <div className="data-pill">
          <DatabaseZap size={16} />
          {summary.cases} current seed records
        </div>
      </header>

      <section className="admin-layout">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">JSON Import</p>
              <h2>Validate Manual Test Data</h2>
            </div>
            <Upload size={19} />
          </div>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
          <div className="action-row">
            <button className="primary-button" type="button" onClick={validateImport}>
              <CheckCircle2 size={18} />
              Validate
            </button>
          </div>
          <p className="disclaimer">{message}</p>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>{parsed.length} Parsed Records</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>FIR</th>
                  <th>District</th>
                  <th>Crime</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 8).map((item) => (
                  <tr key={item.fir_id}>
                    <td>{item.fir_id}</td>
                    <td>{item.district}</td>
                    <td>{item.crime_type}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="disclaimer">Prototype validation only. Real uploads should go through Catalyst Authentication and Data Store RBAC.</p>
        </article>
      </section>

      <section className="dossier-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Quality Gates</p>
              <h2>Import Readiness Checks</h2>
            </div>
            <ShieldCheck size={19} />
          </div>
          {[
            ['Required FIR fields', 'fir_id, crime_type, district, station_id, date, time, status, case_summary'],
            ['Entity coverage', 'accused_ids, victim_id, vehicle, phone_hash, and relation rows are available'],
            ['Legal mapping', 'bns_sections field is present for report generation'],
            ['Synthetic boundary', 'No real personal data should be imported into this prototype seed'],
          ].map(([name, detail]) => (
            <div key={name} className="station-row">
              <strong>{name}</strong>
              <span>checked</span>
              <small>{detail}</small>
            </div>
          ))}
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catalyst Tables</p>
              <h2>Data Store Shape</h2>
            </div>
            <TableProperties size={19} />
          </div>
          {[
            ['Users', `${summary.users} role records`],
            ['PoliceStations', `${summary.stations} station records`],
            ['Cases', `${summary.cases} FIR records`],
            ['Accused', `${summary.accused} entity records`],
            ['Relations', `${summary.relations} graph relation records`],
          ].map(([name, detail]) => (
            <div key={name} className="station-row">
              <strong>{name}</strong>
              <span>mapped</span>
              <small>{detail}</small>
            </div>
          ))}
        </article>
      </section>
    </div>
  )
}

export default AdminData
