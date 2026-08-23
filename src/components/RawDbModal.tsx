'use client';

import React, { useState, useEffect } from 'react';
import { getRawDatabaseString, saveRawDatabaseString, exportDatabaseFile } from '@/lib/storage';
import { X, Copy, Download, Upload, Save, Check, FileCode } from 'lucide-react';

import { useActionFeedback } from '@/components/ActionFeedbackProvider';

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
  const { showToast, confirmAction } = useActionFeedback();
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
    showToast({ title: 'JSON Copiado', message: 'El texto de la base de datos fue copiado al portapapeles.', type: 'info' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveText = () => {
    confirmAction({
      title: '¿Guardar Cambios en BD JSON?',
      message: 'Se actualizará el estado de Cuenta Casa con el contenido JSON del editor.',
      variant: 'warning',
      confirmText: 'Guardar Cambios',
      onConfirm: () => {
        const result = saveRawDatabaseString(jsonText);
        if (result.success) {
          setStatusMessage({ text: '¡Base de datos JSON guardada correctamente!' });
          showToast({ title: '¡Base de Datos Actualizada!', message: 'Los cambios en la base de datos fueron guardados.', type: 'success' });
          onDbUpdated();
          setTimeout(() => setStatusMessage(null), 3000);
        } else {
          setStatusMessage({ text: result.error || 'Error al guardar JSON', isError: true });
          showToast({ title: 'Error en JSON', message: result.error || 'Error al procesar la sintaxis JSON.', type: 'error' });
        }
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          confirmAction({
            title: '¿Importar Archivo JSON?',
            message: `Se reemplazará toda la base de datos local con los datos del archivo "${file.name}".`,
            variant: 'warning',
            confirmText: 'Importar y Reemplazar',
            onConfirm: () => {
              setJsonText(content);
              const result = saveRawDatabaseString(content);
              if (result.success) {
                setStatusMessage({ text: `¡Archivo "${file.name}" importado con éxito!` });
                showToast({ title: '¡Importación Exitosa!', message: `Base de datos importada desde "${file.name}".`, type: 'success' });
                onDbUpdated();
              } else {
                setStatusMessage({ text: result.error || 'Error al procesar archivo JSON', isError: true });
                showToast({ title: 'Error al Importar', message: result.error || 'El archivo seleccionado no es válido.', type: 'error' });
              }
            }
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.70)',
      backdropFilter: 'blur(8px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0'
    }} className="no-print" onClick={onClose}>
      
      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px',
          width: '100%',
          maxWidth: '840px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--md-shadow-elevation-4)',
          padding: '14px 24px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Material Design Drag Handle */}
        <div style={{
          width: '36px',
          height: '4px',
          borderRadius: '9999px',
          backgroundColor: 'var(--md-sys-color-outline-variant)',
          margin: '0 auto 4px auto',
          opacity: 0.8
        }} />

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
