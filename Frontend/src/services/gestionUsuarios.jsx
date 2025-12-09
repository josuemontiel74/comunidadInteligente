export const registrarUsuario = async (datos,token) => {
    try {
        const resUsuario = await fetch("http://localhost:3001/api/usuario", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(
                datos),
        });
        return resUsuario;
    } catch (err) {
        throw err;
    }
};
