import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Conditions Generales d'Utilisation",
  description:
    "Conditions generales d'utilisation de la plateforme GestiStay.",
}

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Conditions G&eacute;n&eacute;rales d&apos;Utilisation
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Derni&egrave;re mise &agrave; jour : 14 avril 2026
      </p>

      {/* 1 - Objet */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">1. Objet</h2>
        <p className="text-muted-foreground leading-relaxed">
          Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales
          d&apos;Utilisation (ci-apr&egrave;s &laquo;&nbsp;CGU&nbsp;&raquo;)
          ont pour objet de d&eacute;finir les modalit&eacute;s et conditions
          d&apos;utilisation de la plateforme GestiStay (ci-apr&egrave;s
          &laquo;&nbsp;la Plateforme&nbsp;&raquo;), accessible &agrave;
          l&apos;adresse gestistay.com, ainsi que les droits et obligations des
          utilisateurs. En acc&eacute;dant &agrave; la Plateforme ou en
          l&apos;utilisant, vous acceptez sans r&eacute;serve les
          pr&eacute;sentes CGU.
        </p>
      </section>

      {/* 2 - Inscription */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">2. Inscription</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          L&apos;acc&egrave;s &agrave; certaines fonctionnalit&eacute;s de la
          Plateforme n&eacute;cessite la cr&eacute;ation d&apos;un compte
          utilisateur. Lors de l&apos;inscription, l&apos;utilisateur
          s&apos;engage &agrave;&nbsp;:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>Fournir des informations exactes, compl&egrave;tes et &agrave; jour</li>
          <li>Maintenir la confidentialit&eacute; de ses identifiants de connexion</li>
          <li>Notifier imm&eacute;diatement tout usage non autoris&eacute; de son compte</li>
          <li>&Ecirc;tre &acirc;g&eacute;(e) d&apos;au moins 18 ans</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-3">
          GestiStay se r&eacute;serve le droit de suspendre ou supprimer tout
          compte ne respectant pas ces conditions.
        </p>
      </section>

      {/* 3 - Services */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">3. Services propos&eacute;s</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          GestiStay est une plateforme de gestion de locations courte
          dur&eacute;e permettant aux propri&eacute;taires de&nbsp;:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>Publier et g&eacute;rer leurs annonces de logements</li>
          <li>G&eacute;rer les r&eacute;servations et le calendrier de disponibilit&eacute;</li>
          <li>Communiquer avec les voyageurs</li>
          <li>Recevoir les paiements de mani&egrave;re s&eacute;curis&eacute;e</li>
          <li>Suivre la comptabilit&eacute; et les revenus</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-3">
          Les voyageurs peuvent rechercher, consulter et r&eacute;server des
          logements propos&eacute;s sur la Plateforme.
        </p>
      </section>

      {/* 4 - Obligations propriétaire */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          4. Obligations du propri&eacute;taire
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Le propri&eacute;taire s&apos;engage &agrave;&nbsp;:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>
            Fournir des descriptions exactes et des photos repr&eacute;sentatives
            de ses logements
          </li>
          <li>
            Respecter les obligations l&eacute;gales li&eacute;es &agrave; la
            location courte dur&eacute;e (d&eacute;claration en mairie,
            num&eacute;ro d&apos;enregistrement, etc.)
          </li>
          <li>
            Garantir la s&eacute;curit&eacute; et la salubrit&eacute; du logement
          </li>
          <li>Honorer les r&eacute;servations confirm&eacute;es</li>
          <li>
            R&eacute;pondre aux messages des voyageurs dans un d&eacute;lai
            raisonnable
          </li>
          <li>
            Souscrire une assurance adapt&eacute;e &agrave; l&apos;activit&eacute;
            de location
          </li>
        </ul>
      </section>

      {/* 5 - Obligations voyageur */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          5. Obligations du voyageur
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Le voyageur s&apos;engage &agrave;&nbsp;:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>Respecter le r&egrave;glement int&eacute;rieur du logement</li>
          <li>
            Ne pas d&eacute;passer le nombre maximum d&apos;occupants
            indiqu&eacute;
          </li>
          <li>
            Signaler tout d&eacute;g&acirc;t ou dysfonctionnement au
            propri&eacute;taire
          </li>
          <li>
            Quitter le logement dans l&apos;&eacute;tat dans lequel il
            l&apos;a trouv&eacute;
          </li>
          <li>Respecter les horaires d&apos;arriv&eacute;e et de d&eacute;part</li>
        </ul>
      </section>

      {/* 6 - Réservation et paiement */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          6. R&eacute;servation et paiement
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          La r&eacute;servation est effectu&eacute;e directement entre le
          voyageur et le propri&eacute;taire via la Plateforme. Le paiement est
          trait&eacute; de mani&egrave;re s&eacute;curis&eacute;e par notre
          prestataire de paiement Stripe.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          GestiStay fonctionne sur un mod&egrave;le d&apos;abonnement fixe pour
          les propri&eacute;taires et ne pr&eacute;l&egrave;ve aucune commission
          sur les r&eacute;servations. Les tarifs des abonnements sont
          disponibles sur la page Tarifs de la Plateforme.
        </p>
      </section>

      {/* 7 - Annulation */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">7. Annulation</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Les conditions d&apos;annulation sont d&eacute;finies par chaque
          propri&eacute;taire pour ses logements. En cas d&apos;annulation&nbsp;:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>
            <strong>Par le voyageur&nbsp;:</strong> le remboursement est
            effectu&eacute; selon la politique d&apos;annulation du logement
          </li>
          <li>
            <strong>Par le propri&eacute;taire&nbsp;:</strong> le voyageur est
            int&eacute;gralement rembours&eacute; et le propri&eacute;taire
            peut faire l&apos;objet de p&eacute;nalit&eacute;s
          </li>
        </ul>
      </section>

      {/* 8 - Responsabilité */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">8. Responsabilit&eacute;</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          GestiStay agit en tant qu&apos;interm&eacute;diaire technique et ne
          peut &ecirc;tre tenu responsable&nbsp;:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>
            De l&apos;exactitude des informations fournies par les
            propri&eacute;taires
          </li>
          <li>
            De la qualit&eacute; des logements ou des services
            propos&eacute;s
          </li>
          <li>Des litiges entre propri&eacute;taires et voyageurs</li>
          <li>
            Des dommages directs ou indirects li&eacute;s &agrave;
            l&apos;utilisation de la Plateforme
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-3">
          GestiStay s&apos;efforce toutefois de maintenir la Plateforme
          accessible et fonctionnelle, sans pouvoir garantir une
          disponibilit&eacute; ininterrompue.
        </p>
      </section>

      {/* 9 - Protection des données */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          9. Protection des donn&eacute;es
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          GestiStay s&apos;engage &agrave; prot&eacute;ger les donn&eacute;es
          personnelles de ses utilisateurs conform&eacute;ment au
          R&egrave;glement G&eacute;n&eacute;ral sur la Protection des
          Donn&eacute;es (RGPD) et &agrave; la loi Informatique et
          Libert&eacute;s. Pour plus de d&eacute;tails, veuillez consulter
          notre Politique de Confidentialit&eacute;.
        </p>
      </section>

      {/* 10 - Propriété intellectuelle */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          10. Propri&eacute;t&eacute; intellectuelle
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          L&apos;ensemble des &eacute;l&eacute;ments composant la Plateforme
          (textes, images, logos, code source, design) est prot&eacute;g&eacute;
          par le droit de la propri&eacute;t&eacute; intellectuelle. Toute
          reproduction, distribution ou utilisation non autoris&eacute;e de ces
          &eacute;l&eacute;ments est strictement interdite. Les contenus
          publi&eacute;s par les utilisateurs (descriptions, photos) restent
          leur propri&eacute;t&eacute;, mais ils conc&egrave;dent &agrave;
          GestiStay une licence non exclusive pour les afficher sur la
          Plateforme.
        </p>
      </section>

      {/* 11 - Modification des CGU */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">
          11. Modification des CGU
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          GestiStay se r&eacute;serve le droit de modifier les pr&eacute;sentes
          CGU &agrave; tout moment. Les utilisateurs seront inform&eacute;s de
          toute modification par notification sur la Plateforme ou par email. La
          poursuite de l&apos;utilisation de la Plateforme apr&egrave;s
          notification vaut acceptation des nouvelles CGU.
        </p>
      </section>

      {/* 12 - Droit applicable */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">12. Droit applicable</h2>
        <p className="text-muted-foreground leading-relaxed">
          Les pr&eacute;sentes CGU sont r&eacute;gies par le droit
          fran&ccedil;ais. En cas de litige, les parties s&apos;efforceront de
          trouver une solution amiable. &Agrave; d&eacute;faut, les tribunaux
          comp&eacute;tents seront ceux du si&egrave;ge social de GestiStay.
          Conform&eacute;ment &agrave; l&apos;article L.612-1 du Code de la
          consommation, le consommateur peut recourir gratuitement &agrave; un
          m&eacute;diateur de la consommation.
        </p>
      </section>
    </div>
  )
}
