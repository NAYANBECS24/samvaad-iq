import { Camera, Car, FileSearch, Fingerprint, GitBranch, Radio, ShieldCheck, UserRoundSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cases, getAccused, getStation } from '../services/prototypeEngine.js'

const evidenceItems = cases
  .filter((caseRecord) => caseRecord.vehicle !== 'NA' || caseRecord.phone_hash !== 'NA')
  .slice(0, 6)

function buildPlate(caseRecord, index) {
  if (caseRecord.vehicle && caseRecord.vehicle !== 'NA') return caseRecord.vehicle
  return `KA-${String(10 + index).padStart(2, '0')}-SYN-${caseRecord.fir_id.slice(-3)}`
}

function DigitalEvidence() {
  const active = evidenceItems[0] || cases[0]
  const station = getStation(active)
  const accused = getAccused(active)[0]

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Digital Evidence</p>
          <h1>CCTV / Media Analysis Workbench</h1>
        </div>
        <div className="intent-pill">
          <Radio size={16} />
          LIVE REVIEW
        </div>
      </header>

      <section className="media-layout">
        <article className="media-feed-frame">
          <div className="feed-camera-label">
            <Camera size={18} />
            <span>{station?.station_name || active.station_id} CAM-04</span>
            <strong>{active.time}</strong>
          </div>
          <div className="feed-road">
            <span className="lane lane-one" />
            <span className="lane lane-two" />
            <span className="vehicle-shape" />
            <span className="person-shape" />
          </div>
          <div className="media-sweep" />
          <div className="detection-box plate-box">
            <Car size={15} />
            {buildPlate(active, 0)}
          </div>
          <div className="detection-box face-box">
            <UserRoundSearch size={15} />
            {accused?.accused_id || active.accused_ids[0]}
          </div>
          <div className="feed-hud">
            <span>object lock 91%</span>
            <span>face hash 84%</span>
            <span>plate OCR 88%</span>
          </div>
        </article>

        <aside className="panel media-detection-list">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Extracted Entities</p>
              <h2>{active.fir_id}</h2>
            </div>
            <Fingerprint size={19} />
          </div>
          {[
            ['Vehicle Plate', buildPlate(active, 0), Car],
            ['Face Hash', accused?.accused_id || active.accused_ids[0], UserRoundSearch],
            ['Phone Hash', active.phone_hash, Fingerprint],
            ['Evidence Confidence', '0.88', ShieldCheck],
          ].map(([label, value, Icon]) => (
            <div key={label} className="evidence-link-row">
              <Icon size={17} />
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
          <div className="mini-action-row">
            <Link to={`/network/${active.fir_id}`}>
              <GitBranch size={14} />
              Push to Graph
            </Link>
            <Link to={`/cases/${active.fir_id}`}>
              <FileSearch size={14} />
              Case Dossier
            </Link>
          </div>
        </aside>
      </section>

      <section className="media-chip-grid">
        {evidenceItems.map((caseRecord, index) => (
          <article key={caseRecord.fir_id} className="panel media-evidence-card">
            <div>
              <p className="eyebrow">Media Match</p>
              <h2>{caseRecord.fir_id}</h2>
            </div>
            <div className="media-mini-feed">
              <span />
              <strong>{buildPlate(caseRecord, index)}</strong>
            </div>
            <p>{caseRecord.case_summary}</p>
            <div className="mini-action-row">
              <Link to={`/network/${caseRecord.fir_id}`}>
                <GitBranch size={13} />
                Graph Link
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default DigitalEvidence
