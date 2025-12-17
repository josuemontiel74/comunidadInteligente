export const handleSubmit = async (username, password) => {
  try {
    const res = await fetch("http://localhost:3001/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    // Retornar el objeto JSON tal cual para que el componente controle la lógica
    return data;
  } catch (err) {
    throw err;
  }
}