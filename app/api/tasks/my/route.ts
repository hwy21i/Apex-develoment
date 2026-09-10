import { GET as tasks } from "../route";
export async function GET(request: Request) { const url = new URL(request.url); url.searchParams.set("mine", "true"); return tasks(new Request(url)); }
