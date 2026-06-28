import { useState } from 'react';
import { Check, FileText, CheckCircle, Upload } from 'lucide-react';
import DocumentUpload from '../shared/DocumentUpload';

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
    'Property Disputes': [
      { name: 'Sale Deed / Title Deed', desc: 'Primary document proving ownership status' },
      { name: 'Property Tax Receipts', desc: 'Proof of continuous possession and tax payments' },
      { name: 'Mutation Certificate', desc: 'Proof of registration of title in revenue records' },
      { name: 'Survey Map / Patta', desc: 'Official boundaries and land categorization record' }
    ],
    'Employment Law': [
      { name: 'Offer Letter / Employment Contract', desc: 'Proves employment status, terms, and salary details' },
      { name: 'Salary Slips / Bank Statement', desc: 'Proof of actual payments made and pending amounts' },
      { name: 'Termination Letter / Email', desc: 'If applicable, states the formal grounds for termination' },
      { name: 'Company Policy / Employee Handbook', desc: 'Reference for standard dispute or notice rules' }
    ],
    'Family Law': [
      { name: 'Marriage Certificate', desc: 'Legal proof of marriage' },
      { name: 'Identity Proofs of both parties', desc: 'Aadhaar, Passport, or PAN card' },
      { name: 'Income Proof / Asset List', desc: 'Necessary for maintenance and property division claims' },
      { name: 'Any past police complaints or mediation records', desc: 'Proof of prior attempts or disputes' }
    ],
    'Consumer Complaints': [
      { name: 'Purchase Invoice / Bill', desc: 'Primary proof of transaction and amount paid' },
      { name: 'Warranty Card', desc: 'Proof of coverage and warranty terms' },
      { name: 'Written correspondence with seller/company', desc: 'Proof of escalation and seller response' },
      { name: 'Photographs of the defective product', desc: 'Visual proof of issues or damage' }
    ],
    'Criminal Defense': [
      { name: 'First Information Report (FIR) Copy', desc: 'Official complaint registered by the police' },
      { name: 'Arrest Memo / Bail Order (if any)', desc: 'Documents related to custody or temporary release' },
      { name: 'Show Cause Notice or Summons', desc: 'Court order directing appearance or response' },
      { name: 'Evidence / Alibi Proofs', desc: 'Photos, videos, location logs, or witness details' }
    ],
    'Cybercrime': [
      { name: 'Bank Statement highlighting fraud transactions', desc: 'Proof of monetary loss' },
      { name: 'Screenshots of phishing emails, messages, or websites', desc: 'Visual evidence of fraud medium' },
      { name: 'UPI/Transaction Receipts', desc: 'Specific ID and details of transfer' },
      { name: 'Complaint acknowledgement from National Cyber Crime Portal', desc: 'Proof of official reporting' }
    ],
    'RTI Cases': [
      { name: 'Draft RTI Application', desc: 'The list of specific queries/information requested' },
      { name: 'Proof of Payment (RTI fee)', desc: 'Receipt of Indian Postal Order, demand draft, or online payment' },
      { name: 'Response from PIO (if any)', desc: 'Official reply received from Public Information Officer' },
      { name: 'First Appeal copy (if filed)', desc: 'Appeal sent to Appellate Authority upon rejection or delay' }
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

      <div className="checklist-upload-section" style={{ marginTop: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '12px' }}>Upload Documents</h3>
        <DocumentUpload 
          sessionId={sessionId}
          documentTypes={docs}
          onUploadComplete={(data) => {
            console.log('File uploaded:', data);
          }}
          onError={(error) => {
            console.error('Upload error:', error);
          }}
        />
      </div>
    </div>
  );
}
