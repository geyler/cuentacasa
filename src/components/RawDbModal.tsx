'use client';

import React, { useState, useEffect } from 'react';
import { getRawDatabaseString, saveRawDatabaseString, exportDatabaseFile } from '@/lib/storage';
import { X, Copy, Download, Upload, Save, Check, FileCode } from 'lucide-react';

interface RawDbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDbUpdated: () => void;
}

export const RawDbModal: React.FC<RawDbModalProps> = ({
  isOpen,
  onClose,
  onDbUpdated
}) => {
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setJsonText(getRawDatabaseString());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveText = () => {
    const result = saveRawDatabaseString(jsonText);
    if (result.success) {
      setStatusMessage({ text: '¡Base de datos JSON guardada correctamente!' });
      onDbUpdated();
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage({ text: result.error || 'Error al guardar JSON', isError: true });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setJsonText(content);
          const result = saveRawDatabaseString(content);
          if (result.success) {
            setStatusMessage({ text: `¡Archivo "${file.name}" importado y guardado con éxito!` });
            onDbUpdated();
          } else {
            setStatusMessage({ text: result.error || 'Error al procesar archivo JSON', isError: true });
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }} className="no-print">
      
      <div style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        color: 'var(--md-sys-color-on-surface)',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--md-shadow-elevation-3)',
        padding: '24px',
        border: '1px solid var(--md-sys-color-surface-variant)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={22} color="var(--md-sys-color-primary)" />
              <span>Base de Datos Cruda (Archivo JSON)</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
              Los datos se almacenan 100% offline en archivos JSON crudos. Puedes editarlos, copiarlos o exportarlos.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--md-sys-color-on-surface-variant)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 700,
            backgroundColor: statusMessage.isError ? 'var(--md-sys-color-expense-container)' : 'var(--md-sys-color-income-container)',
            color: statusMessage.isError ? 'var(--md-sys-color-on-expense-container)' : 'var(--md-sys-color-on-income-container)'
          }}>
            {statusMessage.text}
          </div>
        )}

        {/* Toolbar Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              className="md-btn md-btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copiado' : 'Copiar Texto JSON'}</span>
            </button>

            <button
              onClick={exportDatabaseFile}
              className="md-btn md-btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              <Download size={16} />
              <span>Descargar cuentacasa_db.json</span>
            </button>

            <label className="md-btn md-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <Upload size={16} />
              <span>Importar Archivo JSON</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <button
            onClick={handleSaveText}
            className="md-btn md-btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            <Save size={16} />
            <span>Guardar Cambios en JSON</span>
          </button>

        </div>

        {/* Raw JSON Code Editor */}
        <textarea
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%',
            height: '380px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            padding: '14px',
            borderRadius: '14px',
            border: '1px solid var(--md-sys-color-outline-variant)',
            backgroundColor: '#1E1E1E',
            color: '#D4D4D4',
            outline: 'none',
            resize: 'vertical',
            lineHeight: '1.4'
          }}
        />

      </div>
    </div>
  );
};
