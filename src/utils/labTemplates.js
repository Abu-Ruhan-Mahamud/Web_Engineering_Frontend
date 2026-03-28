/**
 * Lab Test Report Templates
 *
 * Frontend-only JSON constants for common test types.
 * When a lab tech selects a template, the form pre-fills with standard
 * parameters, reference ranges, and units — the tech only enters measured values.
 *
 * Two flavours:
 *   - structured: array of { name, unit, referenceRange } parameter rows
 *   - narrative:  array of { section, prompt } section prompts
 */

// ─── STRUCTURED TEMPLATES ──────────────────────────────────────

export const STRUCTURED_TEMPLATES = [
  {
    id: 'cbc',
    name: 'Complete Blood Count (CBC)',
    category: 'blood',
    parameters: [
      { name: 'Hemoglobin',  unit: 'g/dL',    referenceRange: '12.0–17.5' },
      { name: 'WBC',         unit: '×10³/µL',  referenceRange: '4.5–11.0' },
      { name: 'RBC',         unit: '×10⁶/µL',  referenceRange: '4.5–5.5' },
      { name: 'Platelets',   unit: '×10³/µL',  referenceRange: '150–400' },
      { name: 'Hematocrit',  unit: '%',         referenceRange: '36–48' },
      { name: 'MCV',         unit: 'fL',        referenceRange: '80–100' },
      { name: 'MCH',         unit: 'pg',        referenceRange: '27–33' },
      { name: 'MCHC',        unit: 'g/dL',      referenceRange: '32–36' },
    ],
  },
  {
    id: 'lipid',
    name: 'Lipid Panel',
    category: 'blood',
    parameters: [
      { name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '<200' },
      { name: 'LDL Cholesterol',   unit: 'mg/dL', referenceRange: '<100' },
      { name: 'HDL Cholesterol',   unit: 'mg/dL', referenceRange: '>40' },
      { name: 'Triglycerides',     unit: 'mg/dL', referenceRange: '<150' },
    ],
  },
  {
    id: 'thyroid',
    name: 'Thyroid Panel',
    category: 'blood',
    parameters: [
      { name: 'TSH', unit: 'mIU/L', referenceRange: '0.4–4.0' },
      { name: 'T3',  unit: 'ng/dL',  referenceRange: '80–200' },
      { name: 'T4',  unit: 'µg/dL',  referenceRange: '4.5–12.0' },
    ],
  },
  {
    id: 'bmp',
    name: 'Basic Metabolic Panel (BMP)',
    category: 'blood',
    parameters: [
      { name: 'Glucose',   unit: 'mg/dL',  referenceRange: '70–100' },
      { name: 'BUN',       unit: 'mg/dL',  referenceRange: '7–20' },
      { name: 'Creatinine', unit: 'mg/dL', referenceRange: '0.6–1.2' },
      { name: 'Sodium',    unit: 'mEq/L',  referenceRange: '136–145' },
      { name: 'Potassium', unit: 'mEq/L',  referenceRange: '3.5–5.0' },
      { name: 'Chloride',  unit: 'mEq/L',  referenceRange: '98–106' },
      { name: 'CO₂',       unit: 'mEq/L',  referenceRange: '23–29' },
    ],
  },
  {
    id: 'urinalysis',
    name: 'Urinalysis',
    category: 'urine',
    parameters: [
      { name: 'pH',               unit: '',      referenceRange: '4.5–8.0' },
      { name: 'Specific Gravity', unit: '',      referenceRange: '1.005–1.030' },
      { name: 'Protein',          unit: 'mg/dL', referenceRange: 'Negative' },
      { name: 'Glucose',          unit: 'mg/dL', referenceRange: 'Negative' },
      { name: 'WBC',              unit: '/HPF',  referenceRange: '0–5' },
      { name: 'RBC',              unit: '/HPF',  referenceRange: '0–2' },
    ],
  },
  {
    id: 'ecg',
    name: 'ECG / Cardiac Panel',
    category: 'cardiac',
    parameters: [
      { name: 'Heart Rate',    unit: 'bpm',  referenceRange: '60–100' },
      { name: 'PR Interval',   unit: 'ms',   referenceRange: '120–200' },
      { name: 'QRS Duration',  unit: 'ms',   referenceRange: '80–120' },
      { name: 'QT Interval',   unit: 'ms',   referenceRange: '350–440' },
    ],
  },
];

// ─── NARRATIVE TEMPLATES ───────────────────────────────────────

export const NARRATIVE_TEMPLATES = [
  {
    id: 'chest_xray',
    name: 'Chest X-Ray',
    category: 'imaging',
    sections: [
      { section: 'Heart', prompt: 'Heart size: Normal / Enlarged. Cardiac silhouette is…' },
      { section: 'Lungs', prompt: 'Lung fields: Clear bilaterally / Opacity noted in…' },
      { section: 'Pleura', prompt: 'No pleural effusion / Pleural effusion noted…' },
      { section: 'Mediastinum', prompt: 'Mediastinal contours: Within normal limits / Widened…' },
      { section: 'Bones', prompt: 'Bony structures: Intact / Fracture noted…' },
    ],
  },
  {
    id: 'ct_scan',
    name: 'CT Scan',
    category: 'imaging',
    sections: [
      { section: 'Technique', prompt: 'CT scan performed with / without contrast…' },
      { section: 'Findings', prompt: 'Describe findings by anatomical region…' },
      { section: 'Comparison', prompt: 'Compared with prior study dated… / No prior available.' },
    ],
  },
  {
    id: 'mri',
    name: 'MRI',
    category: 'imaging',
    sections: [
      { section: 'Technique', prompt: 'MRI performed with sequences: T1, T2, FLAIR…' },
      { section: 'Findings', prompt: 'Describe signal abnormalities, masses, or lesions…' },
      { section: 'Comparison', prompt: 'Compared with prior study dated… / No prior available.' },
    ],
  },
  {
    id: 'ultrasound',
    name: 'Ultrasound',
    category: 'imaging',
    sections: [
      { section: 'Technique', prompt: 'Ultrasound of [region] performed with [linear/curvilinear] probe…' },
      { section: 'Findings', prompt: 'Describe echogenicity, masses, fluid collections…' },
      { section: 'Measurements', prompt: 'Organ dimensions, lesion sizes if applicable…' },
    ],
  },
  {
    id: 'pathology',
    name: 'Pathology / Histology',
    category: 'pathology',
    sections: [
      { section: 'Gross Description', prompt: 'Specimen: type, size, color, consistency…' },
      { section: 'Microscopic Findings', prompt: 'Describe histological / cytological architecture…' },
      { section: 'Special Stains / IHC', prompt: 'Immunohistochemistry results if performed…' },
    ],
  },
  {
    id: 'microbiology',
    name: 'Microbiology / Culture',
    category: 'microbiology',
    sections: [
      { section: 'Specimen', prompt: 'Source: blood, urine, wound, sputum…' },
      { section: 'Culture Results', prompt: 'Organism isolated: [name] / No growth after [X] hours.' },
      { section: 'Sensitivity', prompt: 'Susceptible to: … Resistant to: …' },
    ],
  },
];

// ─── HELPERS ───────────────────────────────────────────────────

/**
 * Get all templates matching a given test category.
 * Returns both structured and narrative depending on category.
 */
export function getTemplatesForCategory(category) {
  const structured = STRUCTURED_TEMPLATES.filter((t) => t.category === category);
  const narrative = NARRATIVE_TEMPLATES.filter((t) => t.category === category);
  return [...structured, ...narrative];
}

/**
 * Find a template by its ID (searches both structured and narrative).
 */
export function getTemplateById(templateId) {
  return (
    STRUCTURED_TEMPLATES.find((t) => t.id === templateId) ||
    NARRATIVE_TEMPLATES.find((t) => t.id === templateId) ||
    null
  );
}

/**
 * Check whether a template is structured (has `parameters`) or narrative (has `sections`).
 */
export function isStructuredTemplate(template) {
  return Array.isArray(template?.parameters);
}

/**
 * Try to parse a result_value string as a template-based JSON result.
 * Returns the parsed object if valid, or null if it's plain text.
 */
export function parseTemplateResult(resultValue) {
  if (!resultValue || typeof resultValue !== 'string') return null;
  try {
    const parsed = JSON.parse(resultValue);
    if (parsed && parsed.__template && Array.isArray(parsed.parameters)) {
      return parsed;
    }
  } catch {
    // Not JSON — plain text result, return null
  }
  return null;
}

/**
 * Compile parameter values into the JSON format stored in result_value.
 * @param {string} templateId
 * @param {Array<{name, value, unit, referenceRange}>} parameters
 * @returns {string} JSON string for result_value
 */
export function compileStructuredResult(templateId, parameters) {
  return JSON.stringify({
    __template: templateId,
    parameters: parameters.map((p) => ({
      name: p.name,
      value: p.value || '',
      unit: p.unit || '',
      referenceRange: p.referenceRange || '',
    })),
  });
}

/**
 * Compile narrative section answers into the findings text.
 * @param {Array<{section, text}>} sections
 * @returns {string} formatted findings text
 */
export function compileNarrativeFindings(sections) {
  return sections
    .filter((s) => s.text && s.text.trim())
    .map((s) => `${s.section}:\n${s.text.trim()}`)
    .join('\n\n');
}
