import { CheckCircle2, Inbox, Check, X, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { useRuntime } from '../services/runtime.jsx'

function ApprovalInbox() {
  const { runtime } = useRuntime()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (runtime.apiReachable) {
      api.tasks().then((res) => {
        if (active) {
          setTasks(res.tasks || [])
          setLoading(false)
        }
      }).catch((err) => {
        console.error(err)
        if (active) setLoading(false)
      })
    } else {
      setLoading(false)
    }
    return () => { active = false }
  }, [runtime.apiReachable])

  async function handleAction(taskId, action) {
    if (!runtime.apiReachable) return
    try {
      await api.updateApproval(taskId, { status: action })
      setTasks((current) => current.filter((task) => task.taskId !== taskId))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Challenge Addition</p>
          <h1>Approval Inbox</h1>
          <p>Human-in-the-loop task approvals for sensitive investigative workflows.</p>
        </div>
        <span className="data-label">SYNTHETIC DEMO DATA</span>
      </header>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Pending Review</p>
              <h2>Supervisor Inbox</h2>
            </div>
            <Inbox size={22} />
          </div>
          {loading ? (
            <p>Loading tasks...</p>
          ) : tasks.length ? (
            <div className="alert-grid">
              {tasks.map((task, idx) => (
                <div key={idx} className="trend-alert-card">
                  <ShieldAlert size={18} />
                  <div style={{ flex: 1 }}>
                    <strong>{task.title || 'Investigation Review'}</strong>
                    <p>{task.description}</p>
                    <small>Requested by: {task.requester || 'Investigator'}</small>
                  </div>
                  <div className="mini-action-row">
                    <button type="button" className="icon-button neutral" onClick={() => handleAction(task.taskId || task.id, 'rejected')} title="Reject">
                      <X size={16} />
                    </button>
                    <button type="button" className="icon-button primary" onClick={() => handleAction(task.taskId || task.id, 'approved')} title="Approve">
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CheckCircle2 size={28} />
              <strong>No pending approvals</strong>
              <p>All investigation tasks and brief exports have been reviewed.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  )
}

export default ApprovalInbox
