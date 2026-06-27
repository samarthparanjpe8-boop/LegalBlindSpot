import { useState } from 'react';
import './DocumentChecklist.css';

export default function DocumentChecklist({ caseType, sessionId }) {
  const [readyDocs, setReadyDocs] = useState({});

  if (!caseType) {
    return (
      <div className="document-checklist-empty">
        <h3>No case type detected yet</h3>
        <p>Please describe your situation in the chat first to get a custom checklist.</p>
      </div>
    );
  }

  const defaultChecklist = {
    'Tenant Rights': [
      { name: 'Rental Agreement', desc: 'Proof of lease terms, security deposit amount, and notice period' },
      { name: 'Rent Receipts / Bank Statements', desc: 'Proof of monthly rent payment history' },
      { name: 'Written Communications (WhatsApp/Emails)', desc: 'Record of disputes or agreements with the landlord' },
      { name: 'Electricity/Water Bills', desc: 'Proof of utility billing and occupancy' }
    ],
    'Property Dispute': [
      { name: 'Sale Deed / Title Deed', desc: 'Primary document proving ownership status' },
      { name: 'Property Tax Receipts', desc: 'Proof of continuous possession and tax payments' },
      { name: 'Mutation Certificate', desc: 'Proof of registration of title in revenue records' },
      { name: 'Survey Map / Patta', desc: 'Official boundaries and land categorization record' }
    ],
    'Labor / Employment Dispute': [
      { name: 'Offer Letter / Employment Contract', desc: 'Proves employment status, terms, and salary details' },
      { name: 'Salary Slips / Bank Statement', desc: 'Proof of actual payments made and pending amounts' },
      { name: 'Termination Letter / Email', desc: 'If applicable, states the formal grounds for termination' },
      { name: 'Company Policy / Employee Handbook', desc: 'Reference for standard dispute or notice rules' }
    ],
    'Family Dispute': [
      { name: 'Marriage Certificate', desc: 'Legal proof of marriage' },
      { name: 'Identity Proofs of both parties', desc: 'Aadhaar, Passport, or PAN card' },
      { name: 'Income Proof / Asset List', desc: 'Necessary for maintenance and property division claims' },
      { name: 'Any past police complaints or mediation records', desc: 'Proof of prior attempts or disputes' }
    ],
    'Consumer Grievance': [
      { name: 'Purchase Invoice / Bill', desc: 'Primary proof of transaction and amount paid' },
      { name: 'Warranty Card', desc: 'Proof of coverage and warranty terms' },
      { name: 'Written correspondence with seller/company', desc: 'Proof of escalation and seller response' },
      { name: 'Photographs of the defective product', desc: 'Visual proof of issues or damage' }
    ],
    'Contract Dispute': [
      { name: 'Signed Agreement / Contract', desc: 'Primary copy of terms, conditions, and signatures' },
      { name: 'Invoices / Bills Sent', desc: 'Records of services/goods delivered and values' },
      { name: 'Payment Proofs / Ledger', desc: 'Proof of partial payments or defaults' },
      { name: 'Breach Notice / Legal Notices', desc: 'Formal communications sent notifying the breach' }
    ],
    'Defamation': [
      { name: 'Defamatory Statement Evidence', desc: 'Screenshots, articles, voice records, or videos of statements' },
      { name: 'Proof of Publication', desc: 'Evidence that statement reached a third party' },
      { name: 'Damage/Loss Records', desc: 'Loss of job, business records, or impact statements' },
      { name: 'Response / Retraction Demands', desc: 'Notices sent requesting apology or removal' }
    ]
  };

  const docs = defaultChecklist[caseType] || [
    { name: 'Identity Proof (Aadhaar/PAN)', desc: 'Required for any formal legal representation' },
    { name: 'Detailed Case Summary (Written)', desc: 'Timeline of events in chronological order' },
    { name: 'Communications Record', desc: 'WhatsApp chats, emails, or call logs relevant to the dispute' },
    { name: 'Relevant Bills / Receipts', desc: 'Any financial records related to the issue' }
  ];

  const total = docs.length;
  const readyCount = Object.values(readyDocs).filter(Boolean).length;

  const handleToggle = (index) => {
    setReadyDocs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="document-checklist">
      <h2 className="checklist-heading">Document Checklist for {caseType}</h2>
      <div className="checklist-progress">
        <div className="progress-text">{readyCount} of {total} documents ready</div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(readyCount / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="checklist-list">
        {docs.map((doc, idx) => (
          <div 
            key={idx} 
            className={`checklist-item ${readyDocs[idx] ? 'item-checked' : ''}`}
            onClick={() => handleToggle(idx)}
          >
            <div className="checklist-checkbox">
              {readyDocs[idx] ? '✓' : ''}
            </div>
            <div className="checklist-info">
              <span className="checklist-name">{doc.name}</span>
              <span className="checklist-desc">{doc.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="checklist-info-box">
        <p>Drop your documents into the case folder at:</p>
        <code className="checklist-code">/legallink-cases/{sessionId || 'session'}/uploaded/</code>
        <div className="checklist-note">The chatbot terminal detects uploads automatically.</div>
      </div>
    </div>
  );
}
