const honor = [
  { name: "gikusya", work: "Створив сервер,\nРозробив сайт." }
];

const honorList = document.getElementById("honorList");
if (honorList) {
  honor.forEach(person => {
    const card = document.createElement("article");
    card.className = "honor-card";
    const avatar = document.createElement("img");
    avatar.className = "honor-avatar";
    avatar.src = "";
    avatar.alt = `Аватар ${person.name}`;
    avatar.loading = "lazy";
    avatar.decoding = "async";
    avatar.onerror = () => { avatar.onerror = null; avatar.src = ""; };
    const name = document.createElement("h2");
    name.textContent = person.name;
    const work = document.createElement("p");
    work.textContent = person.work;
    card.append(avatar, name, work);
    honorList.appendChild(card);
    loadAvatarImage(avatar, person.name);
  });
}
