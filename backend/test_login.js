const run = async () => {
    try {
        const email = "test" + Date.now() + "@gmail.com";
        const password = "password123";
        
        console.log("Registering...", email);
        const regRes = await fetch("http://localhost:4000/api/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Test User", email, password })
        });
        const regData = await regRes.json();
        console.log("Register output:", regData);

        console.log("Logging in...", email);
        const loginRes = await fetch("http://localhost:4000/api/user/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        console.log("Login output:", loginData);
    } catch(e) {
        console.log("Error:", e);
    }
}
run();
