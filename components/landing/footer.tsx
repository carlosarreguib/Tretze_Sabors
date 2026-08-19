import Link from "next/link"
import { Clock, Mail, MapPin, Phone } from "lucide-react"
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
} from "@/components/ui/iconos-redes"
import { EMPRESA } from "@/lib/constants"

const REDES = [
  { nombre: "Instagram", href: "https://instagram.com", icono: InstagramIcon },
  { nombre: "Facebook", href: "https://facebook.com", icono: FacebookIcon },
  { nombre: "LinkedIn", href: "https://linkedin.com", icono: LinkedinIcon },
]

export function Footer() {
  return (
    <footer id="contacto" className="bg-muted/60 border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2 max-w-sm">
            <p className="font-display text-2xl">
              Tretze<span className="text-primary">Sabors</span>
            </p>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {EMPRESA.eslogan}
            </p>

            <ul className="mt-7 flex gap-2">
              {REDES.map(({ nombre, href, icono: Icono }) => (
                <li key={nombre}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${EMPRESA.nombre} en ${nombre}`}
                    className="w-11 h-11 grid place-items-center rounded-full bg-surface border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors duration-200 cursor-pointer"
                  >
                    <Icono className="w-4 h-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-medium text-sm tracking-wide uppercase text-muted-foreground">
              Contacto
            </h2>
            <ul className="mt-5 space-y-4 text-sm">
              <li>
                <a
                  href={`tel:${EMPRESA.telefonoLink}`}
                  className="flex items-start gap-2.5 hover:text-primary transition-colors duration-200 cursor-pointer"
                >
                  <Phone
                    className="w-4 h-4 mt-0.5 text-primary shrink-0"
                    aria-hidden="true"
                  />
                  <span>{EMPRESA.telefono}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMPRESA.email}`}
                  className="flex items-start gap-2.5 hover:text-primary transition-colors duration-200 cursor-pointer break-all"
                >
                  <Mail
                    className="w-4 h-4 mt-0.5 text-primary shrink-0"
                    aria-hidden="true"
                  />
                  <span>{EMPRESA.email}</span>
                </a>
              </li>
              <li>
                <a
                  href="https://maps.google.com/?q=C/+Schumann+36,+08191+Rubí,+Barcelona"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
                >
                  <MapPin
                    className="w-4 h-4 mt-0.5 text-primary shrink-0"
                    aria-hidden="true"
                  />
                  <span>{EMPRESA.direccionCorta}</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-medium text-sm tracking-wide uppercase text-muted-foreground">
              Horario de reparto
            </h2>
            <p className="mt-5 flex items-start gap-2.5 text-sm">
              <Clock
                className="w-4 h-4 mt-0.5 text-primary shrink-0"
                aria-hidden="true"
              />
              <span>
                Lunes a sábado
                <br />
                <span className="text-muted-foreground">de 12:00 a 16:00</span>
                <br />
                <span className="text-muted-foreground">
                  Domingos cerrado
                </span>
              </span>
            </p>

            <ul className="mt-7 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
                >
                  Acceso clientes
                </Link>
              </li>
              <li>
                <Link
                  href="/registro"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
                >
                  Crear cuenta
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row gap-3 justify-between text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {EMPRESA.nombre}. Todos los derechos
            reservados.
          </p>
          <p>{EMPRESA.direccion}</p>
        </div>
      </div>
    </footer>
  )
}
