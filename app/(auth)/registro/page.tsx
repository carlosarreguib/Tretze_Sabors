import type { Metadata } from "next"
import Link from "next/link"
import { Mail } from "lucide-react"
import { EMPRESA } from "@/lib/constants"

export const metadata: Metadata = { title: "Acceso por invitación" }

export default function RegistroPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 grid place-items-center mx-auto">
          <Mail className="w-7 h-7 text-primary" aria-hidden="true" />
        </div>

        <h1 className="font-display text-2xl">Acceso por invitación</h1>

        <p className="text-muted-foreground text-sm leading-relaxed">
          El acceso a Tretze Sabors es por invitación. Si tu empresa ya trabaja con
          nosotros, contacta con tu administrador para que te dé de alta.
        </p>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Si quieres empezar a trabajar con nosotros, escríbenos a{" "}
          <a
            href={`mailto:${EMPRESA.email}`}
            className="text-primary underline hover:no-underline"
          >
            {EMPRESA.email}
          </a>{" "}
          o llámanos al{" "}
          <a
            href={`tel:${EMPRESA.telefonoLink}`}
            className="text-primary underline hover:no-underline"
          >
            {EMPRESA.telefono}
          </a>
          .
        </p>

        <Link
          href="/login"
          className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors duration-200 cursor-pointer"
        >
          Ir al inicio de sesión
        </Link>
      </div>
    </div>
  )
}
