import { useState } from 'react';
import { Check, FileText, CheckCircle, Upload } from 'lucide-react';

export default function DocumentChecklist({ caseType, sessionId }) {
  const [readyDocs, setReadyDocs] = useState({});

  if (!caseType) {
    return (
      <div className="document-checklist-empty" style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <FileText size={40} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '8px' }}>No case type detected yet</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Please describe your situation in the chat first to get a custom checklist.</p>
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
    <div className="document-checklist" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 className="checklist-heading" style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>Document Checklist for {caseType}</h2>
      
      <div className="checklist-progress" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
        <div className="progress-text" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: '500' }}>
          {readyCount} of {total} documents ready
        </div>
        <div className="progress-bar-container" style={{ background: 'var(--bg-primary)', height: '8px', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(readyCount / total) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'var(--transition)' }}
          />
        </div>
      </div>

      <div className="checklist-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {docs.map((doc, idx) => (
          <div 
            key={idx} 
            className={`checklist-item ${readyDocs[idx] ? 'item-checked' : ''}`}
            onClick={() => handleToggle(idx)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <div className="checklist-checkbox" style={{
              width: '18px',
              height: '18px',
              borderRadius: '3px',
              border: '1px solid var(--border)',
              background: readyDocs[idx] ? 'var(--accent)' : 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              flexShrink: 0,
              marginTop: '2px'
            }}>
              {readyDocs[idx] && <Check size={12} />}
            </div>
            <div className="checklist-info">
              <span className="checklist-name" style={{ display: 'block', fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)' }}>{doc.name}</span>
              <span className="checklist-desc" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{doc.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="checklist-info-box" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={16} style={{ color: 'var(--accent)' }} /> Drop your documents into the case folder at:
        </p>
        <code className="checklist-code" style={{ display: 'block', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--text-primary)', border: '1px solid var(--border)', overflowX: 'auto', marginBottom: '12px' }}>
          /legallink-cases/{sessionId || 'session'}/uploaded/
        </code>
        <div className="checklist-note" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>The chatbot terminal detects uploads automatically.</div>
      </div>
    </div>
  );
}
