import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de Confidentialite",
  description:
    "Politique de confidentialite et protection des donnees personnelles de GestiStay, conforme au RGPD.",
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Politique de Confidentialit&eacute;
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Derni&egrave;re mise &agrave; jour : 14 avril 2026
      </p>

      {/* 1 - Responsable du traitement */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          1. Responsable du traitement
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Le responsable du traitement des donn&eacute;es personnelles
          collect&eacute;es sur la plateforme GestiStay est&nbsp;:
        </p>
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">GestiStay SAS</p>
          <p>10 rue de l&apos;Innovation, 75001 Paris, France</p>
          <p>Email : contact@gestistay.com</p>
          <p>SIRET : 000 000 000 00000</p>
        </div>
      </section>

      {/* 2 - Données collectées */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          2. Donn&eacute;es collect&eacute;es
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Nous collectons les cat&eacute;gories de donn&eacute;es suivantes&nbsp;:
        </p>

        <h3 className="text-base font-medium mt-4 mb-2">
          Donn&eacute;es d&apos;identification
        </h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>Nom, pr&eacute;nom</li>
          <li>Adresse email</li>
          <li>Num&eacute;ro de t&eacute;l&eacute;phone</li>
          <li>Photo de profil (optionnelle)</li>
          <li>Pi&egrave;ce d&apos;identit&eacute; (v&eacute;rification KYC)</li>
        </ul>

        <h3 className="text-base font-medium mt-4 mb-2">
          Donn&eacute;es de r&eacute;servation
        </h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>Dates de s&eacute;jour</li>
          <li>Nombre de voyageurs</li>
          <li>Historique des r&eacute;servations</li>
          <li>Avis et &eacute;valuations</li>
        </ul>

        <h3 className="text-base font-medium mt-4 mb-2">
          Donn&eacute;es financi&egrave;res
        </h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>
            Informations de paiement (trait&eacute;es par Stripe, non
            stock&eacute;es sur nos serveurs)
          </li>
          <li>Historique des transactions</li>
          <li>Informations de facturation</li>
        </ul>

        <h3 className="text-base font-medium mt-4 mb-2">
          Donn&eacute;es techniques
        </h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>Adresse IP</li>
          <li>Type de navigateur et syst&egrave;me d&apos;exploitation</li>
          <li>Donn&eacute;es de navigation (pages visit&eacute;es, dur&eacute;e)</li>
          <li>Cookies et traceurs</li>
        </ul>
      </section>

      {/* 3 - Finalités */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          3. Finalit&eacute;s du traitement
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Vos donn&eacute;es sont collect&eacute;es pour les finalit&eacute;s
          suivantes&nbsp;:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>
            Gestion de votre compte utilisateur et authentification
          </li>
          <li>
            Mise en relation entre propri&eacute;taires et voyageurs
          </li>
          <li>
            Traitement des r&eacute;servations et des paiements
          </li>
          <li>
            Communication relative aux r&eacute;servations (confirmations,
            rappels)
          </li>
          <li>
            V&eacute;rification d&apos;identit&eacute; (KYC) pour la
            s&eacute;curit&eacute;
          </li>
          <li>
            Am&eacute;lioration de nos services et de l&apos;exp&eacute;rience
            utilisateur
          </li>
          <li>
            Envoi de notifications li&eacute;es au service (non
            publicitaires)
          </li>
          <li>Respect de nos obligations l&eacute;gales et fiscales</li>
        </ul>
      </section>

      {/* 4 - Base légale */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">4. Base l&eacute;gale</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Le traitement de vos donn&eacute;es repose sur les bases
          l&eacute;gales suivantes&nbsp;:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>
            <strong>Ex&eacute;cution du contrat&nbsp;:</strong> gestion du
            compte, r&eacute;servations, paiements
          </li>
          <li>
            <strong>Obligation l&eacute;gale&nbsp;:</strong> v&eacute;rification
            d&apos;identit&eacute;, obligations fiscales
          </li>
          <li>
            <strong>Int&eacute;r&ecirc;t l&eacute;gitime&nbsp;:</strong>{" "}
            am&eacute;lioration des services, s&eacute;curit&eacute; de la
            plateforme
          </li>
          <li>
            <strong>Consentement&nbsp;:</strong> cookies non essentiels,
            communications marketing
          </li>
        </ul>
      </section>

      {/* 5 - Durée de conservation */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          5. Dur&eacute;e de conservation
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Vos donn&eacute;es sont conserv&eacute;es pour les dur&eacute;es
          suivantes&nbsp;:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>
            <strong>Donn&eacute;es de compte&nbsp;:</strong> pendant la
            dur&eacute;e de votre inscription, puis 3 ans apr&egrave;s la
            suppression du compte
          </li>
          <li>
            <strong>Donn&eacute;es de r&eacute;servation&nbsp;:</strong> 5 ans
            apr&egrave;s la derni&egrave;re r&eacute;servation (obligations
            comptables)
          </li>
          <li>
            <strong>Documents KYC&nbsp;:</strong> 5 ans apr&egrave;s la fin de
            la relation commerciale
          </li>
          <li>
            <strong>Donn&eacute;es techniques&nbsp;:</strong> 13 mois maximum
          </li>
        </ul>
      </section>

      {/* 6 - Droits des utilisateurs */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          6. Droits des utilisateurs
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Conform&eacute;ment au RGPD, vous disposez des droits suivants&nbsp;:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
          <li>
            <strong>Droit d&apos;acc&egrave;s&nbsp;:</strong> obtenir une copie
            de vos donn&eacute;es personnelles
          </li>
          <li>
            <strong>Droit de rectification&nbsp;:</strong> corriger les
            donn&eacute;es inexactes ou incompl&egrave;tes
          </li>
          <li>
            <strong>Droit de suppression&nbsp;:</strong> demander
            l&apos;effacement de vos donn&eacute;es
          </li>
          <li>
            <strong>Droit &agrave; la portabilit&eacute;&nbsp;:</strong> recevoir
            vos donn&eacute;es dans un format structur&eacute; et lisible par
            machine
          </li>
          <li>
            <strong>Droit d&apos;opposition&nbsp;:</strong> vous opposer au
            traitement de vos donn&eacute;es
          </li>
          <li>
            <strong>Droit &agrave; la limitation&nbsp;:</strong> demander la
            limitation du traitement
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-3">
          Pour exercer vos droits, contactez notre DPO &agrave; l&apos;adresse
          dpo@gestistay.com ou via la page Contact. Vous disposez
          &eacute;galement du droit d&apos;introduire une r&eacute;clamation
          aupr&egrave;s de la CNIL (www.cnil.fr).
        </p>
      </section>

      {/* 7 - Cookies */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          La Plateforme utilise des cookies pour&nbsp;:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>
            <strong>Cookies essentiels&nbsp;:</strong> n&eacute;cessaires au
            fonctionnement de la Plateforme (authentification, s&eacute;curit&eacute;)
          </li>
          <li>
            <strong>Cookies fonctionnels&nbsp;:</strong> personnalisation de
            l&apos;exp&eacute;rience (langue, pr&eacute;f&eacute;rences)
          </li>
          <li>
            <strong>Cookies analytiques&nbsp;:</strong> mesure
            d&apos;audience et am&eacute;lioration du service
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-3">
          Vous pouvez g&eacute;rer vos pr&eacute;f&eacute;rences de cookies
          via la banni&egrave;re de consentement affich&eacute;e lors de votre
          premi&egrave;re visite ou dans les param&egrave;tres de votre
          navigateur.
        </p>
      </section>

      {/* 8 - Transferts internationaux */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          8. Transferts internationaux
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Certaines donn&eacute;es peuvent &ecirc;tre transf&eacute;r&eacute;es
          vers des sous-traitants situ&eacute;s en dehors de l&apos;Union
          Europ&eacute;enne (notamment Stripe pour les paiements et Supabase
          pour l&apos;h&eacute;bergement). Ces transferts sont
          encadr&eacute;s par des clauses contractuelles types approuv&eacute;es
          par la Commission europ&eacute;enne ou par des d&eacute;cisions
          d&apos;ad&eacute;quation, garantissant un niveau de protection
          &eacute;quivalent &agrave; celui de l&apos;UE.
        </p>
      </section>

      {/* 9 - Sécurité */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">9. S&eacute;curit&eacute;</h2>
        <p className="text-muted-foreground leading-relaxed">
          GestiStay met en &oelig;uvre des mesures techniques et
          organisationnelles appropri&eacute;es pour prot&eacute;ger vos
          donn&eacute;es personnelles contre la perte, l&apos;acc&egrave;s non
          autoris&eacute;, la divulgation ou la destruction. Ces mesures
          incluent le chiffrement des donn&eacute;es en transit (HTTPS/TLS),
          l&apos;authentification s&eacute;curis&eacute;e, la limitation
          d&apos;acc&egrave;s aux donn&eacute;es selon le principe du moindre
          privil&egrave;ge, et des audits de s&eacute;curit&eacute;
          r&eacute;guliers.
        </p>
      </section>

      {/* 10 - Contact DPO */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          10. Contact du D&eacute;l&eacute;gu&eacute; &agrave; la Protection
          des Donn&eacute;es
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Pour toute question relative &agrave; la protection de vos
          donn&eacute;es personnelles, vous pouvez contacter notre DPO&nbsp;:
        </p>
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            D&eacute;l&eacute;gu&eacute; &agrave; la Protection des
            Donn&eacute;es
          </p>
          <p>GestiStay SAS</p>
          <p>10 rue de l&apos;Innovation, 75001 Paris, France</p>
          <p>Email : dpo@gestistay.com</p>
        </div>
      </section>
    </div>
  )
}
