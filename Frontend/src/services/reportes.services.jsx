const BASE = "http://localhost:3001/api";
export async function reportes(token,por,rango) {
    return fetch(`${BASE}/reportes/${por}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({rango}),
    });
    
}
export async function reportesvisitas(token,por,rango) {
    return fetch(`${BASE}/reportesvisitas/${por}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({rango}),
    });
    
}
export async function reportepaqueteria(token,por,rango) {
    return fetch(`${BASE}/informePaqueteria/${por}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({rango}),
    });
    
}
