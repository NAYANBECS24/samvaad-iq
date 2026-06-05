import { useMemo, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import { useParams } from 'react-router-dom'
import { buildGraph, cases } from '../services/prototypeEngine.js'

const nodeColors = {
  FIR: '#60a5fa',
  Accused: '#ef4444',
  Victim: '#f59e0b',
  Location: '#10b981',
  Phone: '#a78bfa',
  Vehicle: '#00f0ff',
  Bank: '#f472b6',
}

function NetworkGraph() {
  const { firId } = useParams()
  const [selected, setSelected] = useState(firId || 'FIR-2025-BLR-001')
  const [activeFilters, setActiveFilters] = useState(new Set(Object.keys(nodeColors)))
  const graph = useMemo(() => buildGraph(selected), [selected])

  function toggleFilter(type) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const filteredNodes = graph.nodes
    .filter((node) => activeFilters.has(node.data.type))
    .map((node) => {
      const color = nodeColors[node.data.type] || '#64748b'
      return {
        ...node,
        style: {
          border: `2px solid ${color}`,
          background: 'rgba(17, 24, 39, 0.92)',
          color: '#e2e8f0',
          borderRadius: 12,
          padding: '10px 14px',
          minWidth: 142,
          fontSize: 12,
          fontWeight: 600,
          boxShadow: `0 0 12px ${color}33`,
          backdropFilter: 'blur(8px)',
        },
      }
    })

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
  const filteredEdges = graph.edges
    .filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target))
    .map((e) => ({
      ...e,
      style: { stroke: '#64748b', strokeWidth: 1.5 },
      labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 600 },
    }))

  const typeCounts = graph.nodes.reduce((acc, n) => {
    acc[n.data.type] = (acc[n.data.type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Criminal Network</p>
          <h1>Shared Entity Graph</h1>
        </div>
        <select value={selected} onChange={(event) => setSelected(event.target.value)}>
          {cases.map((caseRecord) => (
            <option key={caseRecord.fir_id} value={caseRecord.fir_id}>
              {caseRecord.fir_id}
            </option>
          ))}
        </select>
      </header>

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Nodes', value: graph.nodes.length, color: 'var(--cyan)' },
          { label: 'Edges', value: graph.edges.length, color: 'var(--emerald)' },
          { label: 'Density', value: graph.nodes.length ? (graph.edges.length / graph.nodes.length).toFixed(1) : '0', color: 'var(--violet)' },
        ].map((stat) => (
          <div key={stat.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 10,
            border: '1px solid var(--line)',
            background: 'var(--surface-2)',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              background: stat.color,
              boxShadow: `0 0 6px ${stat.color}`,
            }} />
            <span style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700 }}>{stat.label}</span>
            <strong style={{
              color: 'var(--text-bright)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.85rem',
            }}>
              {stat.value}
            </strong>
          </div>
        ))}
      </div>

      <section className="graph-layout">
        <div className="graph-surface">
          <ReactFlow nodes={filteredNodes} edges={filteredEdges} fitView minZoom={0.4}>
            <MiniMap pannable zoomable nodeStrokeWidth={3} style={{ background: '#111827' }} />
            <Controls />
            <Background gap={18} size={1} color="rgba(148,163,184,0.06)" />
          </ReactFlow>
        </div>

        <aside className="panel legend-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Legend & Filters</p>
              <h2>{graph.focus.fir_id}</h2>
            </div>
          </div>
          {Object.entries(nodeColors).map(([label, color]) => (
            <div
              key={label}
              className="legend-row"
              style={{
                cursor: 'pointer',
                opacity: activeFilters.has(label) ? 1 : 0.35,
                transition: 'opacity 0.2s',
                padding: '4px 0',
              }}
              onClick={() => toggleFilter(label)}
            >
              <span style={{ background: color, boxShadow: `0 0 6px ${color}44` }} />
              <span style={{ flex: 1 }}>{label}</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--muted)',
              }}>
                {typeCounts[label] || 0}
              </span>
            </div>
          ))}
          <p className="disclaimer">Click legend items to toggle. Graph links are synthetic evidence trails.</p>
        </aside>
      </section>
    </div>
  )
}

export default NetworkGraph
