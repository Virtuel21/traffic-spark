import { Link } from "react-router-dom";

export default function Manual() {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/70 backdrop-blur border-b">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">Mode d'emploi</h1>
          <Link to="/" className="text-sm underline">Retour</Link>
        </div>
      </header>
      <section className="max-w-screen-md mx-auto p-4 space-y-4">
        <p>Cette application estime le trafic SEO incrémental à partir de vos mots-clés.</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Téléchargez votre fichier SEMrush et chargez-le en haut de l'écran.</li>
          <li>Associez chaque colonne à son champ dans le panneau de gauche.</li>
          <li>Ajustez les poids, les CTR et les autres paramètres selon vos hypothèses.</li>
          <li>Analysez le tableau pour voir les clics attendus et les gains potentiels.</li>
        </ol>
        <p>Revenez à l'outil principal pour tester différentes configurations.</p>
      </section>
    </main>
  );
}
