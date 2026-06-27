
export default function IntakeQuestion({ question, options, selectedValue, onSelect, multiSelect = false }) {
  const isSelected = (value) => {
    if (multiSelect) {
      return Array.isArray(selectedValue) && selectedValue.includes(value);
    }
    return selectedValue === value;
  };

  const handleSelect = (value) => {
    if (multiSelect) {
      const current = Array.isArray(selectedValue) ? selectedValue : [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      onSelect(updated);
    } else {
      onSelect(value);
    }
  };

  return (
    <div className="intake-question-container">
      <h2 className="intake-question-title">{question}</h2>
      {multiSelect && <p className="intake-question-subtitle">Select all that apply</p>}

      <div className={`intake-options-grid ${multiSelect ? 'grid-multi' : 'grid-single'}`}>
        {options.map((opt) => {
          const selected = isSelected(opt.value);
          return (
            <div
              key={opt.value}
              className={`intake-option-card ${selected ? 'option-selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.icon && <span className="option-icon">{opt.icon}</span>}
              <div className="option-content">
                <span className="option-label">{opt.label}</span>
                {opt.desc && <span className="option-desc">{opt.desc}</span>}
              </div>
              {multiSelect && (
                <div className="option-checkbox">
                  {selected ? '✓' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
