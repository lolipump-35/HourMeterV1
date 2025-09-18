const inputNumber = document.getElementById("inputNumber");
const inputTypePred = document.getElementById("typePred");
const results = document.getElementById("results");
const sendBtn = document.getElementById("sendButton");
const pie = document.getElementById('pie');
const piePercentage = document.getElementById('pie-percentage');
const pieContainer = document.getElementById("pie-container");
const monthLabelSpan = document.getElementById("current-month");
const monthSelectInput = document.getElementById("month-select");
const toggleBtn = document.getElementById("addOptionsInputValue");
const container = document.getElementById("moreInputsContainer");
const resultLog = document.getElementById("results");
const btnLog = document.getElementById("logButton");

// Couleurs par catégorie TypePred
const typeColors = {
  "Porte à porte": "#A8E6CF",  // vert pastel doux
  "TPS": "#FFD3B6",            // orange clair pastel
  "TPL": "#FFAAA5",            // rose pastel
  "Rue": "#DCE775",            // jaune pastel
  "Etude": "#81D4FA",          // bleu clair pastel
  "Credit": "#B39DDB",         // violet pastel
};


// Icônes pour MoreInputs
const typeIcons = {
  "Premier contacte": "📞",
  "Nouvelle visite": "🏠",
  "Verset": "📖",
  "Revus": "🔄",
  "Invitation": "✉️",
  "Carte de visite": "💳",
  "Video": "🎥"   
};

// Données stockées
let items = JSON.parse(localStorage.getItem("items")) || [];
let currentPourcentage = 0;
let isAnnualView = false;
const monthNames = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];
const todayMonthSelect = new Date();
let currentMonthIndex = todayMonthSelect.getMonth();
monthLabelSpan.textContent = monthNames[currentMonthIndex];

// ------------------- Fonctions de base -------------------

function generateId() {
  let newId;
  do { newId = "id-" + Date.now() + "-" + Math.floor(Math.random() * 1000); }
  while (items.some((item) => item.id === newId));
  return newId;
}

// Appliquer couleur à chaque option d'un select
function colorizeSelectOptions(selectElement) {
  Array.from(selectElement.options).forEach(option => {
    const color = typeColors[option.value] || "#FFFFFF";
    option.style.backgroundColor = color;
    option.style.color = "#000"; // ou blanc selon contraste si tu veux
  });
}

// Exemple pour le select principal
colorizeSelectOptions(inputTypePred);

// Et pour tous les MoreInputs après création
container.querySelectorAll(".typePred").forEach(sel => {
  colorizeSelectOptions(sel);
});

// Compter et additionner inputs
function compterEtAdditionnerInputsNumber(filteredItems = null) {
  const itemsToUse = filteredItems || items;
  let total = 0;
  const breakdownMap = {};

  itemsToUse.forEach(item => {
    const mainVal = parseFloat(item.value) || 0;
    total += mainVal;
    breakdownMap[item.predType] = (breakdownMap[item.predType] || 0) + mainVal;

    
  });

  const breakdown = Object.keys(breakdownMap).map(type => ({ type, value: breakdownMap[type] }));

  return { count: itemsToUse.length, total, breakdown };
}


// ------------------- Camembert avec couleurs par catégorie -------------------
function updatePieWithCategories(filteredItems) {
  const { total, breakdown } = compterEtAdditionnerInputsNumber(filteredItems); 
  const indexPourcentage = isAnnualView ? 600 : 50;

  // Si aucun item ou total = 0, reset le camembert
  if (filteredItems.length === 0 || total === 0) {
    pie.style.background = `conic-gradient(#e0e0e0 0deg 360deg)`;
    piePercentage.textContent = "0%";
    currentPourcentage = 0;
    // 🔹 Met à jour le compteur d’heures
    document.getElementById("total-hours").textContent = "Total heures : 0";
    return;
  }

  const realTargetPercentage = (total / indexPourcentage) * 100; // peut dépasser 100
  const visualTargetPercentage = Math.min(realTargetPercentage, 100); // camembert max 100%

  const start = 0;
  const endVisual = visualTargetPercentage;
  const duration = 800;
  const startTime = performance.now();

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = progress * (2 - progress); // easing

    const visualValue = start + (endVisual - start) * eased;
    const degrees = (visualValue / 100) * 360;

    // Construire les segments colorés
    let cumulative = 0;
    const segments = breakdown.map(b => {
      const deg = (b.value / total) * degrees;
      const seg = `${typeColors[b.type] || "#CCCCCC"} ${cumulative}deg ${cumulative + deg}deg`;
      cumulative += deg;
      return seg;
    });

    pie.style.background = `conic-gradient(${segments.join(", ")}, #e0e0e0 ${cumulative}deg 360deg)`;

    // Affiche le vrai pourcentage même au-delà de 100%
    piePercentage.textContent = `${Math.round(realTargetPercentage)}%`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      currentPourcentage = endVisual;
      // 🔹 Quand l'animation est terminée, on met à jour le total
      document.getElementById("total-hours").textContent = `Total heures : ${total}`;
    }
  }

  requestAnimationFrame(animate);
}




function updateTotalHours(filteredItems = null) {
  const itemsToUse = filteredItems || items; 
  // additionne toutes les valeurs
  const total = itemsToUse.reduce((sum, item) => sum + item.value, 0);
  document.getElementById("total-hours").textContent = `Total heures : ${total}`;
}





// ------------------- Création et édition des items -------------------
function createItemElement(item) {
  const newContainer = document.createElement("div");
  newContainer.classList.add("item-container");
  newContainer.setAttribute("data-id", item.id);
  let editing = false;

  // Date
  const timeElement = document.createElement("p");
  timeElement.textContent = item.time || new Date().toISOString().split("T")[0];
  timeElement.classList.add("timestamp");

  // Nombre principal
  const numberInput = document.createElement("div");
  numberInput.classList.add("numberInput");
  
  const newItem = document.createElement("p");
  newItem.textContent = item.value;
  numberInput.appendChild(newItem);

  // TypePred
  const typePred = document.createElement("p");
  typePred.textContent = item.predType || inputTypePred.value;

  // Boutons
  const options = document.createElement("div");
  options.classList.add("options");
  const editBtn = document.createElement("button");
  editBtn.textContent = "✏️";
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "❌";
  options.appendChild(editBtn);
  options.appendChild(deleteBtn);

  // Ajout éléments
  newContainer.appendChild(timeElement);
  newContainer.appendChild(numberInput);
  newContainer.appendChild(typePred);

  // MoreInputs
  if (item.moreInputs && item.moreInputs.length) {
    item.moreInputs.forEach((mi, index) => {
      const moreNumberDiv = document.createElement("div");
      moreNumberDiv.classList.add("numberInput");
      const morePVal = document.createElement("p");
      morePVal.textContent = mi.value;
      moreNumberDiv.appendChild(morePVal);

      const moreTypeP = document.createElement("p");
      moreTypeP.textContent = typeIcons[mi.predType] || "";

      newContainer.appendChild(moreNumberDiv);
      newContainer.appendChild(moreTypeP);

      makeEditableNumberDecimal(morePVal, `moreValue-${index}`);
      makeEditableSelect(moreTypeP, `morePredType-${index}`, Object.keys(typeIcons), typeIcons);
    });
  }

  newContainer.appendChild(options);
  results.prepend(newContainer);

  // Toggle options
  newContainer.addEventListener("click", (e) => {
    e.stopPropagation();
    const allOptions = document.querySelectorAll(".options.show");
    allOptions.forEach(opt => { if (opt !== options) opt.classList.remove("show"); });
    options.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    const allOptions = document.querySelectorAll(".options.show");
    allOptions.forEach(opt => opt.classList.remove("show"));
    if (!newContainer.contains(e.target)) {
      document.querySelectorAll("#results p").forEach(p => p.style.pointerEvents = "none");
      editing = false;
    }
  });

  // Supprimer
  deleteBtn.addEventListener("click", () => {
    results.removeChild(newContainer);
    items = items.filter(i => i.id !== item.id);
    localStorage.setItem("items", JSON.stringify(items));
    updatePieWithCategories(isAnnualView ? items : filterItemsBySelectedMonth(monthLabelSpan.textContent));
  });

  // Éditer
  editBtn.addEventListener("click", () => {
    document.querySelectorAll("#results p").forEach(p => p.style.pointerEvents = "auto");
    editing = true;
    options.classList.remove("show");
  });

  // Fonctions édition
  function makeEditableNumberDecimal(element, key) {
    element.addEventListener("click", e => {
      e.stopPropagation();
      if (!editing) return;
      const oldValue = item[key] || element.textContent;
      const input = document.createElement("input");
      input.type = "number";
      input.value = oldValue;
      input.classList.add("edit-input");
      element.replaceWith(input);
      input.focus();
      const finalize = () => {
        const newValue = input.value || oldValue;
        element.textContent = newValue;
        item[key] = newValue;
        input.replaceWith(element);
        localStorage.setItem("items", JSON.stringify(items));
        updatePieWithCategories(isAnnualView ? items : filterItemsBySelectedMonth(monthLabelSpan.textContent));
      };
      input.addEventListener("blur", finalize);
      input.addEventListener("keydown", e => { if (e.key === "Enter") finalize(); });
    });
  }

  function makeEditableSelect(element, key, optionsList, iconsMap) {
    element.addEventListener("click", e => {
      e.stopPropagation();
      if (!editing) return;
      const oldValue = item[key] || element.textContent;
      const select = document.createElement("select");
      select.classList.add("edit-input");
      optionsList.forEach(opt => {
        const optionEl = document.createElement("option");
        optionEl.value = opt;
        optionEl.textContent = opt;
        if (opt === oldValue) optionEl.selected = true;
        select.appendChild(optionEl);
      });
      element.replaceWith(select);
      select.focus();
      const finalize = () => {
        const newValue = select.value || oldValue;
        item[key] = newValue;
        element.textContent = iconsMap[newValue] || "";
        select.replaceWith(element);
        localStorage.setItem("items", JSON.stringify(items));
        updatePieWithCategories(isAnnualView ? items : filterItemsBySelectedMonth(monthLabelSpan.textContent));
      };
      select.addEventListener("change", finalize);
      select.addEventListener("blur", finalize);
    });
  }

  makeEditableNumberDecimal(newItem, "value");
  makeEditableSelect(typePred, "predType", Object.keys(typeColors), typeIcons);
}

// ------------------- Ajout d’un nouvel item -------------------
sendBtn.addEventListener("click", () => {
  const valueInputNumber = inputNumber.value.trim();
  if (!valueInputNumber) return;

  const moreBlocks = container.querySelectorAll(".moreInputs");
  const moreInputsArray = [];
  moreBlocks.forEach(block => {
    const inputNum = block.querySelector(".inputNumber");
    const selectType = block.querySelector(".typePred");
    if (inputNum && inputNum.value.trim() !== "") {
      moreInputsArray.push({ value: inputNum.value.trim(), predType: selectType.value });
    }
  });

const newItem = {
  id: generateId(),
  value: valueInputNumber,
  predType: inputTypePred.value,
  moreInputs: moreInputsArray,
  time: new Date().toISOString().split("T")[0]  // ← ajoute la date du jour
};

  items.push(newItem);
  localStorage.setItem("items", JSON.stringify(items));
  createItemElement(newItem);

  inputNumber.value = "";
  moreBlocks.forEach(block => {
    const inputNum = block.querySelector(".inputNumber");
    const selectType = block.querySelector(".typePred");
    if (inputNum) inputNum.value = "";
    if (selectType) selectType.selectedIndex = 0;
    block.classList.remove("open");
    block.style.display = "none";
  });

  updatePieWithCategories(isAnnualView ? items : filterItemsBySelectedMonth(monthLabelSpan.textContent));
});

// ------------------- Log show/hide -------------------
// Crée un tableau de tous les éléments à masquer quand Log est activé
const inputElements = [
  inputNumber,
  inputTypePred,
  sendBtn,
  toggleBtn,
  container
];

// Gestion du bouton Log
btnLog.addEventListener("click", () => {
  // Bascule la visibilité des inputs
  inputElements.forEach(el => {
    if (el) el.style.display = el.style.display === "none" ? "" : "none";
  });

  // Affiche ou masque la zone résultats
  resultLog.style.display = resultLog.style.display === "flex" ? "none" : "flex";
});


// ------------------- Gestion MoreInputs -------------------
function createNewBlock() {
  const block = document.createElement("div");
  block.classList.add("moreInputs", "open");
  block.innerHTML = `
    <div class="moreInputsContent">
      <div class="containerMoreInputs">
        <div class="containerMoreInputsNumber">
          <input type="number" class="inputNumber" placeholder="Nombre" />
        </div>
        <div class="containerMoreInputsSelect">
          <select class="typePred">
            <option value="Premier contacte">Premier Contacte</option>
            <option value="Nouvelle visite">Nouvelle visite</option>
            <option value="Verset">Verset</option>
            <option value="Revus">Revus</option>
            <option value="Invitation">Invitation</option>
            <option value="Carte de visite">Carte de visite</option>
            <option value="Video">Video</option>
          </select>
        </div>
        <button type="button" class="addOptionsmoreInputs">+</button>
        <button type="button" class="removeMoreInputs">–</button>
      </div>
    </div>
  `;
  return block;
}

toggleBtn.addEventListener("click", () => {
  if (container.children.length === 0) {
    container.appendChild(createNewBlock());
    container.classList.add("open");
  } else {
    container.classList.toggle("open");
  }
});

container.addEventListener("click", (e) => {
  const currentBlock = e.target.closest(".moreInputs");
  if (!currentBlock) return;

  if (e.target.classList.contains("addOptionsmoreInputs")) {
    const clone = currentBlock.cloneNode(true);
    clone.querySelector(".inputNumber").value = "";
    clone.querySelector(".typePred").selectedIndex = 0;
    currentBlock.insertAdjacentElement("afterend", clone);
  }
  if (e.target.classList.contains("removeMoreInputs")) {
    currentBlock.remove();
  }
});

// ------------------- Gestion mois -------------------
function populateMonthSelect() {
  monthSelectInput.innerHTML = "";
  monthNames.forEach(month => {
    const option = document.createElement("option");
    option.textContent = month;
    monthSelectInput.appendChild(option);
  });
  monthSelectInput.selectedIndex = currentMonthIndex;
}

function getMonthFromItem(item) {
  if (!item.time) return null;
  return item.time.split("-")[1];
}

function filterItemsBySelectedMonth(monthText) {
  const monthIndex = monthNames.indexOf(monthText) + 1;
  const monthStr = monthIndex.toString().padStart(2, "0");

  const filtered = items.filter(item => {
    const itemMonth = item.time?.split("-")[1]; 
    return itemMonth === monthStr;
  });

  console.log("Mois sélectionné :", monthStr);
  console.log("Éléments filtrés :", filtered);

  return filtered;
}

function showMonthOrYear(isYear) {
  let itemsToShow;

  if (isYear) {
    itemsToShow = items;
    monthLabelSpan.textContent = "Année";
  } else {
    const selectedText = monthSelectInput.options[monthSelectInput.selectedIndex]?.text || monthNames[currentMonthIndex];
    monthLabelSpan.textContent = selectedText;
    itemsToShow = filterItemsBySelectedMonth(selectedText);
  }

  updatePieView(itemsToShow);
}

function updatePieView(filteredItems) {
  results.innerHTML = "";

  filteredItems.forEach(item => createItemElement(item));

  // Reset le pourcentage actuel pour que l'animation parte de zéro
  currentPourcentage = 0;

  updatePieWithCategories(filteredItems);
}


monthLabelSpan.addEventListener("click", (e) => {
  e.stopPropagation();

  populateMonthSelect();

  // Mettre le select sur une valeur neutre pour forcer la détection du changement
  monthSelectInput.selectedIndex = -1;

  monthSelectInput.style.display = "inline-block";
  monthLabelSpan.style.display = "none";
  monthSelectInput.focus();
});


monthSelectInput.addEventListener("change", () => {
  const selectedText = monthSelectInput.options[monthSelectInput.selectedIndex].text;
  monthLabelSpan.textContent = selectedText;
  monthLabelSpan.style.display = "inline-block";
  monthSelectInput.style.display = "none";

  const filtered = filterItemsBySelectedMonth(selectedText);

  console.log("Mise à jour du camembert avec :", filtered);

  updatePieWithCategories(filtered.length ? filtered : []); 
});




document.addEventListener("click", (e) => {
  if (!monthLabelSpan.contains(e.target) && !monthSelectInput.contains(e.target)) {
    monthLabelSpan.style.display = "inline-block";
    monthSelectInput.style.display = "none";
  }
});

// ---- Toggle annuel / mensuel au clic sur le camembert ----
pieContainer.addEventListener("click", () => {
  if (!isAnnualView) {
    // Vue annuelle
    isAnnualView = true;
    monthLabelSpan.textContent = "Année";
    updatePieView(items);  // ✅ ça suffit
  } else {
    // Vue mensuelle → on récupère bien le mois sélectionné
    isAnnualView = false;
    const selectedText = monthSelectInput.options[monthSelectInput.selectedIndex]?.text 
                      || monthNames[currentMonthIndex];

    monthLabelSpan.textContent = selectedText;

    const filtered = filterItemsBySelectedMonth(selectedText);
    updatePieView(filtered);  // ✅ ça suffit
  }
});



// ------------------- Initialisation -------------------
items.forEach(item => createItemElement(item));
populateMonthSelect();
updatePieWithCategories(isAnnualView ? items : filterItemsBySelectedMonth(monthLabelSpan.textContent));

// ------------------- Days remaining -------------------
const today = new Date();
const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
const daysRemaining = daysInMonth - today.getDate();
document.getElementById("days-left").textContent = daysRemaining;
