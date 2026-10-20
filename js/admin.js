document.addEventListener('DOMContentLoaded', async () => {
 const ctx=await window.requireRole('admin'); if(!ctx)return; const {sb}=ctx; const form=document.getElementById('vet-form'), body=document.getElementById('vets-body'), msg=document.getElementById('form-message');
 const say=t=>msg.textContent=t;
 async function list(){const {data,error}=await sb.from('veterinarian_profiles').select('id,username,company_name,profiles!inner(full_name,email)').order('created_at',{ascending:false}); if(error){body.innerHTML=`<tr><td colspan="5">${error.message}</td></tr>`;return;} body.replaceChildren(); for(const v of data){const tr=document.createElement('tr'); [v.username,v.profiles.full_name,v.company_name,v.profiles.email].forEach(x=>{const td=document.createElement('td');td.textContent=x||'';tr.append(td)}); const td=document.createElement('td');td.innerHTML=`<button class="button muted" data-edit="${v.id}">Editar</button> <button class="button danger" data-delete="${v.id}">Eliminar</button>`;tr.append(td);body.append(tr)} }
 async function invoke(payload){
  const {data:{session}}=await sb.auth.getSession();
  if(!session)throw new Error('La sesión expiró. Inicia sesión de nuevo.');
  const {data,error}=await sb.functions.invoke('manage-veterinarian',{body:payload,headers:{Authorization:`Bearer ${session.access_token}`}});
  if(error){
   let detail=error.message;
   if(error.context instanceof Response){try{const body=await error.context.clone().json();detail=body.error||body.message||detail}catch{}}
   else if(error.context?.message)detail=error.context.message;
   if(error.name==='FunctionsFetchError')detail=`No se pudo conectar con manage-veterinarian. Confirma que la función esté desplegada en Supabase y que la URL del proyecto sea correcta. (${detail})`;
   throw new Error(detail);
  }
  if(data?.error)throw new Error(data.error);return data;
 }
 form.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(form), id=f.get('id');try{await invoke({action:id?'update':'create',id:id||undefined,username:f.get('username'),full_name:f.get('full_name'),company_name:f.get('company_name'),email:f.get('email'),password:f.get('password')||undefined});say(id?'Veterinario actualizado.':'Veterinario creado; recibirá el correo de invitación.');form.reset();form.elements.id.value='';form.elements.password.required=true;document.getElementById('cancel-edit').hidden=true;document.getElementById('vet-form-title').textContent='Crear veterinario';await list()}catch(err){say(`No se pudo guardar: ${err.message}`)}});
 body.addEventListener('click',async e=>{const id=e.target.dataset.edit||e.target.dataset.delete;if(!id)return;if(e.target.dataset.edit){const {data,error}=await sb.from('veterinarian_profiles').select('id,username,company_name,profiles!inner(full_name,email)').eq('id',id).single();if(error)return say(error.message);form.elements.id.value=data.id;form.elements.username.value=data.username;form.elements.full_name.value=data.profiles.full_name;form.elements.company_name.value=data.company_name;form.elements.email.value=data.profiles.email;form.elements.password.required=false;document.getElementById('cancel-edit').hidden=false;document.getElementById('vet-form-title').textContent='Editar veterinario';scrollTo({top:0,behavior:'smooth'})}else if(confirm('¿Eliminar el acceso de este veterinario?')){try{await invoke({action:'delete',id});say('Veterinario eliminado.');await list()}catch(err){say(`No se pudo eliminar: ${err.message}`)}}});
 document.getElementById('cancel-edit').addEventListener('click',()=>{form.reset();form.elements.id.value='';form.elements.password.required=true;document.getElementById('cancel-edit').hidden=true;document.getElementById('vet-form-title').textContent='Crear veterinario'}); await list();
});
