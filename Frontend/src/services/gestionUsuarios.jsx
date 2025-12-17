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

export const editarUsuario = async (username, payload, token) => {
    try {
        const res = await fetch(`http://localhost:3001/api/usuario/${username}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        return res;
    } catch (err) {
        throw err;
    }
}

export const finalizarUsuarioService = async (username, token) => {
    try {
        const payload = { estadoId: 2 };
        const res = await fetch(`http://localhost:3001/api/usuario/${username}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        return res;
    } catch (err) {
        throw err;
    }
}

