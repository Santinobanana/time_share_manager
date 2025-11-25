import { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import TitleRoulette from './TitleRoulette';
import { 
  Dices, 
  Hand, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import {
  getTitlesForRaffle,
  getUnassignedLeapWeekYears,
  assignLeapWeek,
  unassignLeapWeek
} from '../../services/leapWeekService';

export default function LeapWeekRaffleModalFinal({ 
  isOpen, 
  onClose, 
  onSuccess,
  currentUserId 
}) {
  const [step, setStep] = useState('method');
  const [titles, setTitles] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignmentMethod, setAssignmentMethod] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [titlesData, yearsData] = await Promise.all([
        getTitlesForRaffle(),
        getUnassignedLeapWeekYears(10)
      ]);
      
      setTitles(titlesData);
      setAvailableYears(yearsData);
      
      if (yearsData.length > 0) {
        setSelectedYear(yearsData[0]);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = (method) => {
    setAssignmentMethod(method);
    if (method === 'manual') {
      setStep('manual');
    } else if (method === 'raffle') {
      setStep('raffle');
    }
  };

  const handleManualSelection = () => {
    if (!selectedTitle) {
      alert('Debes seleccionar un título');
      return;
    }
    
    if (!selectedYear) {
      alert('Debes seleccionar un año');
      return;
    }

    setWinner(selectedTitle);
    setStep('confirm');
  };

  const handleStartRaffle = () => {
    if (!selectedYear) {
      alert('Debes seleccionar un año');
      return;
    }

    setIsSpinning(true);
  };

  const handleWinnerSelected = (winningTitle) => {
    setIsSpinning(false);
    setWinner(winningTitle);
    setStep('confirm');
  };

  const handleConfirmAssignment = async () => {
    if (!winner || !selectedYear) {
      alert('Información incompleta');
      return;
    }

    try {
      setSubmitting(true);

      await assignLeapWeek(
        selectedYear,
        winner.id,
        assignmentMethod,
        currentUserId
      );

      alert(`¡Semana bisiesta del año ${selectedYear} asignada a ${winner.id}!`);
      
      if (onSuccess) {
        onSuccess();
      }

      handleCancel();
    } catch (error) {
      console.error('Error asignando semana bisiesta:', error);
      alert('Error al asignar semana bisiesta: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAssignment = () => {
    if (confirm('¿Estás seguro de cancelar? La semana quedará sin asignar.')) {
      handleCancel();
    }
  };

  const handleCancel = () => {
    setStep('method');
    setSelectedTitle(null);
    setWinner(null);
    setIsSpinning(false);
    setSelectedYear('');
    setAssignmentMethod('');
    onClose();
  };

  const getSerieColor = (titleId) => {
    if (!titleId) return 'bg-gray-100';
    const serie = titleId.charAt(0);
    return {
      'A': 'bg-serie-a',
      'B': 'bg-serie-b',
      'C': 'bg-serie-c',
      'D': 'bg-serie-d'
    }[serie] || 'bg-gray-100';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="🎰 Rifa de Semana Bisiesta"
      size="large"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Calendar className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Semana Bisiesta (Semana 53)</p>
              <p>
                Algunos años tienen 53 semanas en lugar de 52. Esta semana extra se asigna 
                a un título mediante sorteo o selección manual.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Año con semana bisiesta a asignar
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            disabled={loading || step === 'confirm'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
          >
            <option value="">-- Selecciona un año --</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {availableYears.length === 0 && !loading && (
            <p className="text-sm text-gray-500 mt-2">
              No hay años con semana bisiesta sin asignar
            </p>
          )}
        </div>

        {step === 'method' && selectedYear && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Selecciona el método de asignación
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleMethodSelect('manual')}
                className="border-2 border-gray-300 rounded-xl p-6 hover:border-purple-500 hover:bg-purple-50 transition-all group text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                    <Hand size={32} className="text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Asignación Manual
                  </h4>
                  <p className="text-sm text-gray-600">
                    Selecciona manualmente el título ganador
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleMethodSelect('raffle')}
                className="border-2 border-gray-300 rounded-xl p-6 hover:border-yellow-500 hover:bg-yellow-50 transition-all group text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-yellow-200 transition-colors">
                    <Dices size={32} className="text-yellow-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Sorteo por Ruleta
                  </h4>
                  <p className="text-sm text-gray-600">
                    Sorteo aleatorio entre los 48 títulos
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 'manual' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Selecciona el título ganador
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep('method')}
              >
                ← Volver
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto p-2">
              {titles.map(title => (
                <button
                  key={title.id}
                  onClick={() => setSelectedTitle(title)}
                  className={`
                    ${getSerieColor(title.id)} 
                    rounded-lg p-4 text-center font-medium
                    transition-all border-2
                    ${selectedTitle?.id === title.id 
                      ? 'border-purple-600 ring-2 ring-purple-300 scale-105' 
                      : 'border-transparent hover:border-gray-400'
                    }
                  `}
                >
                  {title.id}
                </button>
              ))}
            </div>

            {selectedTitle && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-900 font-medium">Título seleccionado:</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {selectedTitle.id}
                    </p>
                  </div>
                  <CheckCircle className="text-purple-600" size={32} />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setStep('method')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleManualSelection}
                disabled={!selectedTitle}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'raffle' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Sorteo Aleatorio
              </h3>
              {!isSpinning && !winner && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStep('method')}
                >
                  ← Volver
                </Button>
              )}
            </div>

            <TitleRoulette
              titles={titles}
              onWinnerSelected={handleWinnerSelected}
              isSpinning={isSpinning}
            />

            {!isSpinning && !winner && (
              <Button
                onClick={handleStartRaffle}
                className="w-full bg-yellow-500 hover:bg-yellow-600 py-4 text-lg"
              >
                <Sparkles size={24} className="mr-2" />
                Girar Ruleta
              </Button>
            )}
          </div>
        )}

        {step === 'confirm' && winner && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <Sparkles className="text-green-600" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Título Ganador!
              </h3>
              <p className="text-gray-600">
                El siguiente título ha sido seleccionado para recibir la semana bisiesta
              </p>
            </div>

            <div className={`${getSerieColor(winner.id)} rounded-xl p-8 text-center border-4 border-green-500`}>
              <div className="text-6xl font-bold text-gray-900 mb-4">
                {winner.id}
              </div>
              <div className="text-xl text-gray-700">
                Serie {winner.serie} · Subserie {winner.subserie} · #{winner.number}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Año:</span>
                  <span className="ml-2 font-bold text-gray-900">{selectedYear}</span>
                </div>
                <div>
                  <span className="text-gray-600">Semana:</span>
                  <span className="ml-2 font-bold text-gray-900">53 (Bisiesta)</span>
                </div>
                <div>
                  <span className="text-gray-600">Método:</span>
                  <span className="ml-2 font-bold text-gray-900 capitalize">
                    {assignmentMethod === 'manual' ? 'Manual' : 'Ruleta'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Título:</span>
                  <span className="ml-2 font-bold text-gray-900">{winner.id}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-yellow-900">
                  <p className="font-medium mb-1">Confirma la asignación</p>
                  <p>
                    Esta acción asignará la semana 53 del año {selectedYear} al título {winner.id}. 
                    Podrás cancelar esta asignación más tarde si es necesario.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleCancelAssignment}
                disabled={submitting}
                className="flex-1"
              >
                <XCircle size={20} className="mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmAssignment}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle size={20} className="mr-2" />
                {submitting ? 'Asignando...' : 'Confirmar Asignación'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}