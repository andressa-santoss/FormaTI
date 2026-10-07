const ADMIN_SESSION_KEY='formatiAdminSession';
const ADMIN_CREDENTIALS={username:'admin@formati.com',password:'admin123',name:'Administrador FormaTI',role:'Administrador'};
function getAdminSession(){try{return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY)||'null')}catch{return null}}
function isAdminAuthenticated(){const s=getAdminSession();return !!(s&&s.authenticated&&s.role==='Administrador')}
function requireAdmin(){if(!isAdminAuthenticated())location.href='admin-login.html'}
function adminLogout(){localStorage.removeItem(ADMIN_SESSION_KEY);location.href='admin-login.html'}
function openRecovery(){document.getElementById('recoveryModal').classList.add('open')}
function closeRecovery(){document.getElementById('recoveryModal').classList.remove('open')}
document.addEventListener('DOMContentLoaded',()=>{
  const login=document.getElementById('adminLoginForm');
  if(login){
    if(isAdminAuthenticated())location.href='admin.html';
    login.addEventListener('submit',e=>{
      e.preventDefault();const user=document.getElementById('adminUser').value.trim().toLowerCase();const pass=document.getElementById('adminPassword').value;const msg=document.getElementById('loginMessage');
      if(user===ADMIN_CREDENTIALS.username&&pass===ADMIN_CREDENTIALS.password){localStorage.setItem(ADMIN_SESSION_KEY,JSON.stringify({authenticated:true,username:user,name:ADMIN_CREDENTIALS.name,role:ADMIN_CREDENTIALS.role,loginAt:new Date().toISOString()}));location.href='admin.html';return}
      msg.hidden=false;msg.className='auth-message error';msg.textContent='Credenciais inválidas ou usuário sem permissão administrativa.';
    });
    const recovery=document.getElementById('recoveryForm');if(recovery)recovery.addEventListener('submit',e=>{e.preventDefault();closeRecovery();alert('Solicitação registrada no protótipo. Em produção, um serviço de recuperação enviará o link por e-mail.')});
  }
  if(document.body.classList.contains('admin-shell'))requireAdmin();
});
