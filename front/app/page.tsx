import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  Heart, 
  Shield, 
  Users, 
  FileText,
  MessageCircle,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">MediConnect</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <Link href="#servicios" className="text-gray-600 hover:text-blue-600 transition">
              Servicios
            </Link>
            <Link href="#nosotros" className="text-gray-600 hover:text-blue-600 transition">
              Nosotros
            </Link>
            <Link href="#contacto" className="text-gray-600 hover:text-blue-600 transition">
              Contacto
            </Link>
          </div>
          <div className="flex space-x-3">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Tu salud, nuestra{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  prioridad
                </span>
              </h1>
              <p className="text-xl text-gray-600">
                Atención médica de calidad con tecnología avanzada. Reserva tus turnos en línea, 
                accede a tu historial clínico y comunícate con nuestros profesionales.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Comenzar Ahora
                  </Button>
                </Link>
                <Link href="#servicios">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Conocer Más
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&h=600&fit=crop"
                  alt="Equipo médico"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">5000+</p>
                    <p className="text-sm text-gray-600">Pacientes atendidos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ofrecemos atención médica integral con servicios digitales innovadores
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Turnos Online</CardTitle>
                <CardDescription>
                  Reserva tus citas médicas en línea, 24/7, desde cualquier dispositivo
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Historial Clínico</CardTitle>
                <CardDescription>
                  Accede a tu historial médico completo en cualquier momento y lugar
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Chat en Vivo</CardTitle>
                <CardDescription>
                  Comunícate instantáneamente con nuestro personal de recepción
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Medicina General</CardTitle>
                <CardDescription>
                  Atención primaria de salud con médicos generalistas experimentados
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle>Especialidades</CardTitle>
                <CardDescription>
                  Cardiología, pediatría, traumatología y más especialidades médicas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Atención Ágil</CardTitle>
                <CardDescription>
                  Recordatorios automáticos y gestión eficiente de tu tiempo
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Nosotros */}
      <section id="nosotros" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">
                Sobre MediConnect
              </h2>
              <p className="text-lg text-gray-600">
                Somos una clínica médica integral con más de 10 años de experiencia en atención 
                de la salud. Nos especializamos en brindar servicios médicos de calidad con 
                tecnología de punta.
              </p>
              <p className="text-lg text-gray-600">
                Nuestro equipo está conformado por profesionales altamente capacitados comprometidos 
                con el bienestar de nuestros pacientes.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div>
                  <p className="text-3xl font-bold text-blue-600">15+</p>
                  <p className="text-gray-600">Especialidades</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">30+</p>
                  <p className="text-gray-600">Profesionales</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">5000+</p>
                  <p className="text-gray-600">Pacientes</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">10+</p>
                  <p className="text-gray-600">Años de experiencia</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=450&fit=crop"
                  alt="Clínica MediConnect"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Contacto
            </h2>
            <p className="text-xl text-gray-600">
              Estamos aquí para ayudarte
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Teléfono</CardTitle>
                <CardDescription>
                  +54 9 381 555-1234
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Email</CardTitle>
                <CardDescription>
                  contacto@mediconnect.com
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Dirección</CardTitle>
                <CardDescription>
                  Av. Libertador 1234, Tucumán
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">MediConnect</span>
              </div>
              <p className="text-gray-400">
                Clínica Médica Integral - Tu salud, nuestra prioridad
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Servicios</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Medicina General</li>
                <li>Especialidades</li>
                <li>Turnos Online</li>
                <li>Historial Clínico</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Información</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Sobre Nosotros</li>
                <li>Nuestro Equipo</li>
                <li>Contacto</li>
                <li>Preguntas Frecuentes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Horarios</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Lunes a Viernes: 8:00 - 20:00</li>
                <li>Sábados: 9:00 - 13:00</li>
                <li>Domingos: Cerrado</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 MediConnect. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}