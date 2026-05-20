exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Méthode non autorisée." })
      };
    }

    const { prompt, style, secteur } = JSON.parse(event.body || "{}");

    if (!prompt || prompt.length < 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "La demande est trop courte. Décris un peu plus le site voulu."
        })
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Clé API OpenAI manquante dans Netlify."
        })
      };
    }

    const finalPrompt = `
Tu es une IA experte en création de maquettes de sites web.

Crée une page HTML complète avec CSS intégré dans une balise <style>.

Contraintes :
- Réponds uniquement avec du code HTML.
- Ne mets pas de texte avant ou après.
- Ne mets pas de Markdown.
- Ne mets pas de JavaScript.
- La page doit être responsive.
- Le design doit être moderne, propre et vendable.
- Structure attendue : header, hero, section services, section avantages, avis clients, appel à l'action, footer.
- Utilise des couleurs cohérentes avec le style demandé.
- Utilise du faux texte professionnel si besoin.

Secteur : ${secteur || "non précisé"}
Style : ${style || "moderne et professionnel"}

Demande client :
${prompt}
`;

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        input: finalPrompt
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return {
        statusCode: openaiResponse.status,
        body: JSON.stringify({
          error: data.error?.message || "Erreur OpenAI."
        })
      };
    }

    let html = data.output_text || "";

    html = html
      .replace(/```html/g, "")
      .replace(/```/g, "")
      .trim();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ html })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur serveur : " + error.message
      })
    };
  }
};
