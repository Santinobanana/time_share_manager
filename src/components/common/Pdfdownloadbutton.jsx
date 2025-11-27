import { useState } from 'react';
import Button from './Button';
import { Download, FileText, Loader } from 'lucide-react';
import { 
  generarYDescargarPDFTitulo, 
  generarYDescargarPDFMultiplesTitulos 
} from '../../utils/PdfGenerator';

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

      // 🔥 IMPORTANTE: Enriquecer títulos con semanas bisiestas
      let enrichedData = data;
      
      if (isMultiple) {
        // Para múltiples títulos, enriquecer cada uno
        const { enrichTitleWithLeapWeeks } = await import('../../services/titleLeapWeeksHelper');
        enrichedData = await Promise.all(
          data.map(title => enrichTitleWithLeapWeeks(title))
        );
      } else {
        // Para un solo título, enriquecerlo
        const { enrichTitleWithLeapWeeks } = await import('../../services/titleLeapWeeksHelper');
        enrichedData = await enrichTitleWithLeapWeeks(data);
      }

      // Generar y descargar según el tipo
      if (isMultiple) {
        await generarYDescargarPDFMultiplesTitulos(enrichedData, userName);
      } else {
        await generarYDescargarPDFTitulo(enrichedData, userName);
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
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}