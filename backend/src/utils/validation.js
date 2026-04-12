function isValidNickname(nickname) {
  if (typeof nickname !== "string") return false;

  // минимум 3 символа
  if (nickname.length < 3) return false;

  // только латиница и цифры, не начинается с цифры
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(nickname)) return false;

  return true;
}

module.exports = { isValidNickname };