import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!service)return reply({error:"Missing server configuration"},500);
 const token=req.headers.get("Authorization")?.replace(/^Bearer\s+/i,"");if(!token)return reply({error:"Authentication required"},401);
 const caller=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}}});
 const {data:{user},error:userError}=await caller.auth.getUser();if(userError||!user)return reply({error:"Invalid session"},401);
 const {data:profile}=await caller.from("profiles").select("role").eq("id",user.id).single();if(profile?.role!=="admin")return reply({error:"Administrator role required"},403);
 let body:any;try{body=await req.json()}catch{return reply({error:"Invalid JSON"},400)}
 const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
 try{
  if(body.action==="create"){
   if(!body.email||!body.username||!body.full_name||!body.company_name)return reply({error:"Missing required fields"},400);
   let created:any;
   if(body.password){if(String(body.password).length<10)return reply({error:"Use a password with at least 10 characters"},400);const result=await admin.auth.admin.createUser({email:body.email,password:body.password,email_confirm:true,user_metadata:{full_name:body.full_name}});if(result.error)throw result.error;created=result.data.user}
   else {const result=await admin.auth.admin.inviteUserByEmail(body.email,{data:{full_name:body.full_name}});if(result.error)throw result.error;created=result.data.user}
   if(!created)return reply({error:"Supabase did not return the created user"},500);
   const p=await admin.from("profiles").upsert({id:created.id,role:"veterinarian",full_name:body.full_name,email:body.email}).select().single();if(p.error){await admin.auth.admin.deleteUser(created.id);throw p.error}
   const v=await admin.from("veterinarian_profiles").insert({id:created.id,username:body.username,company_name:body.company_name});if(v.error){await admin.auth.admin.deleteUser(created.id);throw v.error}
   return reply({id:created.id});
  }
  if(body.action==="update"){
   if(!body.id||!body.email||!body.username||!body.full_name||!body.company_name)return reply({error:"Missing required fields"},400);
   const attrs:any={email:body.email,email_confirm:true,user_metadata:{full_name:body.full_name}};if(body.password){if(String(body.password).length<10)return reply({error:"Use a password with at least 10 characters"},400);attrs.password=body.password}
   const auth=await admin.auth.admin.updateUserById(body.id,attrs);if(auth.error)throw auth.error;
   const p=await admin.from("profiles").update({full_name:body.full_name,email:body.email,role:"veterinarian"}).eq("id",body.id);if(p.error)throw p.error;
   const v=await admin.from("veterinarian_profiles").update({username:body.username,company_name:body.company_name}).eq("id",body.id);if(v.error)throw v.error;return reply({ok:true});
  }
  if(body.action==="delete"){
   if(!body.id)return reply({error:"Missing veterinarian id"},400);
   const check=await admin.from("veterinarian_profiles").select("id").eq("id",body.id).maybeSingle();if(check.error)throw check.error;if(!check.data)return reply({error:"Veterinarian not found"},404);
   const result=await admin.auth.admin.deleteUser(body.id);if(result.error)throw result.error;return reply({ok:true});
  }
  return reply({error:"Unsupported action"},400);
 }catch(e){return reply({error:e instanceof Error?e.message:"Unexpected server error"},400)}
});
