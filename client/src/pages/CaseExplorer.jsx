import { FileSearch, Filter, GitBranch, ListChecks, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CaseCard from '../components/CaseCard.jsx'
import { cases, findSimilarCases, getStation } from '../services/prototypeEngine.js'

const allValue = 'All'

function uniqueValues(field) {
  return [allValue, ...new Set(cases.map((caseRecord) => caseRecord[field]))]
}

function CaseExplorer() {
  const [query, setQuery] = useState('')
  const [district, setDistrict] = useState(allValue)
  const [crimeType, setCrimeType] = useState(allValue)
  const [status, setStatus] = useState(allValue)
  const [selectedFir, setSelectedFir] = useState('SYN-2026-LEG-1003')

  const filteredCases = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cases
      .filter((caseRecord) => district === allValue || caseRecord.district === district)
      .filter((caseRecord) => crimeType === allValue || caseRecord.crime_type === crimeType)
      .filter((caseRecord) => status === allValue || caseRecord.status === status)
      .filter((caseRecord) => {
        if (!q) return true
        return [
          caseRecord.fir_id,
          caseRecord.crime_type,
          caseRecord.district,
          caseRecord.status,
          caseRecord.mo,
          caseRecord.case_summary,
          caseRecord.vehicle,
          caseRecord.phone_hash,
          ...caseRecord.accused_ids,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [crimeType, district, query, status])

  const selectedCase = cases.find((caseRecord) => caseRecord.fir_id === selectedFir) || filteredCases[0] || cases[0]
  const selectedMatches = findSimilarCases(selectedCase.fir_id).matches.slice(0, 3)
  const activeCount = filteredCases.filter((caseRecord) => ['Open', 'Under Investigation'].includes(caseRecord.status)).length
  const stationCount = new Set(filteredCases.map((caseRecord) => caseRecord.station_id)).size

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Case Registry</p>
          <h1>FIR Case Explorer</h1>
        </div>
        <div className="data-pill">
          <ListChecks size={16} />
          {filteredCases.length} visible records
        </div>
      </header>

      <section className="control-strip explorer-controls">
        <label>
          Search
          <span className="input-with-icon">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="FIR, MO, vehicle, accused" />
          </span>
        </label>
        <label>
          District
          <select value={district} onChange={(event) => setDistrict(event.target.value)}>
            {uniqueValues('district').map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Crime Type
          <select value={crimeType} onChange={(event) => setCrimeType(event.target.value)}>
            {uniqueValues('crime_type').map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {uniqueValues('status').map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="kpi-grid compact-kpis">
        <article className="kpi-card">
          <FileSearch size={22} />
          <span>Filtered FIRs</span>
          <strong>{filteredCases.length}</strong>
        </article>
        <article className="kpi-card">
          <Filter size={22} />
          <span>Active Workload</span>
          <strong>{activeCount}</strong>
        </article>
        <article className="kpi-card">
          <GitBranch size={22} />
          <span>Stations In Scope</span>
          <strong>{stationCount}</strong>
        </article>
        <article className="kpi-card emphasis">
          <Sparkles size={22} />
          <span>Top DNA Match</span>
          <strong>{selectedMatches[0] ? Math.round(selectedMatches[0].score * 100) : 0}</strong>
        </article>
      </section>

      <section className="explorer-layout">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Records</p>
              <h2>Filtered FIR Table</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table className="case-table">
              <thead>
                <tr>
                  <th>FIR</th>
                  <th>Crime</th>
                  <th>District</th>
                  <th>Station</th>
                  <th>Status</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((caseRecord) => (
                  <tr
                    key={caseRecord.fir_id}
                    className={caseRecord.fir_id === selectedCase.fir_id ? 'selected-row' : ''}
                    onClick={() => setSelectedFir(caseRecord.fir_id)}
                  >
                    <td>{caseRecord.fir_id}</td>
                    <td>{caseRecord.crime_type}</td>
                    <td>{caseRecord.district}</td>
                    <td>{getStation(caseRecord)?.station_name || caseRecord.station_id}</td>
                    <td>{caseRecord.status}</td>
                    <td>
                      <Link to={`/cases/${caseRecord.fir_id}`}>Dossier</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="side-stack">
          <CaseCard caseRecord={selectedCase} compact />
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Fast Handoff</p>
                <h2>{selectedCase.fir_id}</h2>
              </div>
            </div>
            <div className="handoff-grid">
              <Link to={`/cases/${selectedCase.fir_id}`}>
                <FileSearch size={17} />
                Open Dossier
              </Link>
              <Link to={`/network/${selectedCase.fir_id}`}>
                <GitBranch size={17} />
                Entity Graph
              </Link>
              <Link to={`/similar/${selectedCase.fir_id}`}>
                <Sparkles size={17} />
                DNA Match
              </Link>
            </div>
          </article>
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Nearest Matches</p>
                <h2>Crime DNA Preview</h2>
              </div>
            </div>
            {selectedMatches.map((match) => (
              <div key={match.case.fir_id} className="station-row">
                <strong>{match.case.fir_id}</strong>
                <span>{Math.round(match.score * 100)} score</span>
                <small>{match.reasons.slice(0, 3).join(', ')}</small>
              </div>
            ))}
          </article>
        </aside>
      </section>
    </div>
  )
}

export default CaseExplorer
