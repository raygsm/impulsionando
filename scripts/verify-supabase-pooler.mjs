import net from "node:net";

const host = process.env.PGHOST?.trim();
const port = Number(process.env.PGPORT);
if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Invalid Supabase database host or port");
}

await new Promise((resolve, reject) => {
  const socket = net.createConnection({ host, port });
  const timeout = setTimeout(() => {
    socket.destroy();
    reject(new Error("Timed out connecting to the Supabase database endpoint"));
  }, 10_000);

  socket.once("connect", () => {
    clearTimeout(timeout);
    socket.end();
    resolve();
  });
  socket.once("error", (error) => {
    clearTimeout(timeout);
    reject(new Error(`Supabase database endpoint is unreachable: ${error.code ?? "unknown error"}`));
  });
});

console.log("Supabase database endpoint is reachable");
