import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';

export default function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    titles: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Simulación de títulos disponibles
  const availableTitles = [
    'A-1-1', 'A-1-2', 'A-1-3', 'A-1-4',
    'A-2-1', 'A-2-2', 'A-2-3', 'A-2-4',
    'B-1-1', 'B-1-2', 'B-1-3', 'B-1-4',
    'C-1-1', 'C-1-2', 'C-1-3', 'C-1-4',
    'D-1-1', 'D-1-2', 'D-1-3', 'D-1-4'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTitleToggle = (title) => {
    setFormData({
      ...formData,
      titles: formData.titles.includes(title)
        ? formData.titles.filter(t => t !== title)
        : [...formData.titles, title]
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        setError('Por favor completa todos los campos requeridos');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }
    
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.titles.length === 0) {
      setError('Debes seleccionar al menos un título');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await register(formData);
      setSuccess(true);
    } catch (err) {
      setError('Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Card>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">¡Registro exitoso!</h3>
              <p className="text-gray-600 mb-6">
                Tu registro está pendiente de aprobación por un administrador. 
                Te notificaremos por correo cuando tu cuenta esté activa.
              </p>
              <Button onClick={() => navigate('/login')}>
                Ir al inicio de sesión
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Crear cuenta</h2>
          <p className="mt-2 text-gray-600">Paso {step} de 2</p>
        </div>

        <Card>
          <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()}>
            {step === 1 && (
              <>
                <Input
                  label="Nombre completo"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  required
                />

                <Input
                  label="Correo electrónico"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />

                <Input
                  label="Teléfono"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+52 123 456 7890"
                />

                <Input
                  label="Contraseña"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />

                <Input
                  label="Confirmar contraseña"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Selecciona tus títulos
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona los títulos que te corresponden. El administrador revisará tu solicitud.
                </p>
                
                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {availableTitles.map((title) => {
                    const serie = title.charAt(0);
                    const colorClass = {
                      'A': 'bg-serie-a hover:bg-green-400',
                      'B': 'bg-serie-b hover:bg-blue-400',
                      'C': 'bg-serie-c hover:bg-yellow-400',
                      'D': 'bg-serie-d hover:bg-purple-400'
                    }[serie];
                    
                    return (
                      <button
                        key={title}
                        type="button"
                        onClick={() => handleTitleToggle(title)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          formData.titles.includes(title)
                            ? `${colorClass} ring-2 ring-gray-700`
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {title}
                      </button>
                    );
                  })}
                </div>
                
                {formData.titles.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Títulos seleccionados:</strong> {formData.titles.join(', ')}
                    </p>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBack}
                  fullWidth
                >
                  Atrás
                </Button>
              )}
              
              {step === 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  fullWidth
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? 'Registrando...' : 'Completar registro'}
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-gray-700 font-medium hover:text-gray-900">
                Inicia sesión
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}