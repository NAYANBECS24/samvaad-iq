const { cases } = require('./seedData')

const legalCategoryMap = {
  'Motorcycle Theft': {
    bns: '303(2), 317',
    ipc: '379, 411',
    privacyTag: 'Hashed phone/vehicle identifiers; role-restricted export',
    legalNote: 'Theft and possession/recovery support mapping for human legal review.',
  },
  'Chain Snatching': {
    bns: '304(2), 3(5)',
    ipc: '356, 379',
    privacyTag: 'Victim and phone fields minimized; export requires review',
    legalNote: 'Snatching/theft category with common-intention support where applicable.',
  },
  'UPI Fraud': {
    bns: '318(4), IT Act 66D',
    ipc: '420, IT Act 66D',
    privacyTag: 'Financial identifiers masked; account links remain synthetic hashes',
    legalNote: 'Cheating by impersonation and cyber-fraud support mapping.',
  },
  'House Burglary': {
    bns: '331, 305',
    ipc: '454, 380',
    privacyTag: 'Location is coarse synthetic station-level context',
    legalNote: 'House-breaking and theft support mapping for case brief review.',
  },
}

function legalExplainabilityForCase(firId) {
  const caseRecord = cases.find((item) => item.fir_id === firId) || cases[0]
  const mapping = legalCategoryMap[caseRecord.crime_type] || {
    bns: caseRecord.bns_sections,
    ipc: 'Legacy IPC mapping requires reviewer input',
    privacyTag: 'Role-restricted synthetic evidence',
    legalNote: 'Legal mapping requires human review.',
  }

  return {
    firId: caseRecord.fir_id,
    crimeType: caseRecord.crime_type,
    bns: caseRecord.bns_sections || mapping.bns,
    ipc: mapping.ipc,
    privacyTag: mapping.privacyTag,
    legalNote: mapping.legalNote,
    humanActionNote: 'Advisory investigation support only; no automated accusation or enforcement decision.',
    evidenceIds: [caseRecord.fir_id, caseRecord.victim_id, caseRecord.vehicle, caseRecord.phone_hash].filter(
      (item) => item && item !== 'NA',
    ),
  }
}

module.exports = { legalExplainabilityForCase }
