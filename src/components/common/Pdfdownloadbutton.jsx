import { useState } from 'react';
import Button from './Button';
import { Download, FileText, Loader } from 'lucide-react';
import { 
  generarYDescargarPDFTitulo, 
  generarYDescargarPDFMultiplesTitulos 
} from '../../utils/pdfGenerator';

/**
 * Componente botón para descargar PDF de calendario
 * @param {Object} props
 * @param {Object|Array} props.data - Título individual o array de títulos
 * @param {string} props.userName - Nombre del usuario propietario
 * @param {string} props.variant - Variante del botón (default, primary, secondary, etc)
 * @param {string} props.size - Tamaño del botón (sm, md, lg)
 * @param {boolean} props.showIcon - Mostrar icono de descarga
 * @param {string} props.label - Texto del botón
 * @param {string} props.className - Clases CSS adicionales
 */
export default function PDFDownloadButton({
  data,
  userName = '',
  variant = 'secondary',
  size = 'md',
  showIcon = true,
  label,
  className = ''
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Determinar si son múltiples títulos
  const isMultiple = Array.isArray(data);
  const defaultLabel = isMultiple 
    ? `Descargar calendario (${data.length} títulos)` 
    : 'Descargar calendario PDF';

  const handleDownload = async () => {
    try {
      setGenerating(true);
      setError(null);

      // Validaciones
      if (!data) {
        throw new Error('No hay datos para generar el PDF');
      }

      if (isMultiple && data.length === 0) {
        throw new Error('No hay títulos para generar el PDF');
      }

      // Generar y descargar según el tipo
      if (isMultiple) {
        await generarYDescargarPDFMultiplesTitulos(data, userName);
      } else {
        await generarYDescargarPDFTitulo(data, userName);
      }

      // Pequeño delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.error('Error generando PDF:', err);
      setError(err.message || 'Error al generar el PDF');
      
      // Mostrar alert con el error
      alert('Error al generar PDF: ' + (err.message || 'Error desconocido'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={generating || !data}
        className={`${className} ${generating ? 'opacity-75 cursor-wait' : ''}`}
      >
        {generating ? (
          <>
            <Loader size={16} className={`${size === 'sm' ? 'mr-1' : 'mr-2'} animate-spin`} />
            Generando PDF...
          </>
        ) : (
          <>
            {showIcon && (
              <Download size={16} className={size === 'sm' ? 'mr-1' : 'mr-2'} />
            )}
            {label || defaultLabel}
          </>
        )}
      </Button>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 max-w-xs z-10">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Versión compacta del botón (solo icono)
 */
export function PDFDownloadIconButton({
  data,
  userName = '',
  tooltip = 'Descargar PDF',
  className = ''
}) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setGenerating(true);
      const isMultiple = Array.isArray(data);

      if (isMultiple) {
        await generarYDescargarPDFMultiplesTitulos(data, userName);
      } else {
        await generarYDescargarPDFTitulo(data, userName);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al generar PDF: ' + (err.message || 'Error desconocido'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={generating || !data}
      title={tooltip}
      className={`
        inline-flex items-center justify-center
        p-2 rounded-lg
        bg-gray-100 hover:bg-gray-200
        text-gray-700 hover:text-gray-900
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {generating ? (
        <Loader size={18} className="animate-spin" />
      ) : (
        <FileText size={18} />
      )}
    </button>
  );
}