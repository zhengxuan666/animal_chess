function generateRoomId() {
  // For a real-world application, consider using a more robust library like 'uuid' or 'nanoid'.
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function generatePlayerId() {
  return Math.random().toString(36).substr(2, 8);
}

module.exports = {
  generateRoomId,
  generatePlayerId,
};
