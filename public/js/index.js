// Get Xlsx quotes
async function fetchData() {
  try {
    const response = await fetch("/data", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    return [];
  }
}

const phraseContainer = document.getElementById("phrase-container");
const phraseText = document.getElementById("phrase");
const phraseAuthor = document.getElementById("auteur");

let phrases = [];

document.addEventListener("DOMContentLoaded", async () => {
  phrases = await fetchData();
});

document.addEventListener("keydown", function (event) {
  if (event.code === "Space" && phrases.length > 0) {
    const index = Math.floor(Math.random() * phrases.length);
    const phrase = phrases[index];
    phraseText.textContent = phrase.Phrase;
    phraseAuthor.textContent = phrase.Auteur;
  }
});

// Gestionnaire d'événements pour les interactions mobiles
document.addEventListener("touchstart", function (event) {
  if (phrases.length > 0) {
    const index = Math.floor(Math.random() * phrases.length);
    const phrase = phrases[index];
    phraseText.textContent = phrase.Phrase;
    phraseAuthor.textContent = phrase.Auteur;
  }
});


// Intro disappearing 
function handleInteraction() {
  var phrase1 = document.getElementById("intro");
  var phrase2 = document.getElementById("phrase-container");
  if (phrase1.style.display !== "none") {
    phrase1.style.display = "none";
    phrase1.disabled = true;
    phrase2.style.display = "block";
  } else {
    phrase1.style.display = "none";
    phrase1.disabled = true;
    phrase2.style.display = "block";
  }
}

// Gestion des interactions clavier
document.addEventListener("keydown", function (event) {
  if (event.code === "Space") {
    handleInteraction();
  }
});

// Gestion des interactions mobiles
document.addEventListener("touchstart", function (event) {
  handleInteraction();
});



// Animation Intro
function selectIntroText() {
  var screenWidth = window.innerWidth;
  var text;

  if (screenWidth > 924) {
    // Texte pour les écrans de plus de 924 pixels de large (ordinateurs)
    text = "Pour générer des citations, appuyez sur la touche espace.";
  } else {
    // Texte pour les écrans de moins de 924 pixels de large (téléphones)
    text = "Touchez l'écran pour générer des citations.";
  }

  return text;
}

var text = selectIntroText();

function typeWriter(text, i, fnCallback) {
  if (i < text.length) {
    document.getElementById("intro").innerHTML += text.charAt(i);
    i++;
    setTimeout(function() {
      typeWriter(text, i, fnCallback)
    }, 50);
  } else if (typeof fnCallback == 'function') {
    setTimeout(fnCallback, 1000);
  }
}
typeWriter(text, 0, function() {
  console.log("Dactylographie terminée !");
});