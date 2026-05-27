import { useAuthStore } from '../store/authStore';

const ProfilePage = () => {
  const { user } = useAuthStore();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="w-24 h-24 bg-[#B45309] text-white rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-lg shadow-[#B45309]/20">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-3xl font-black text-stone-900 font-serif-display mb-1">{user?.name}</h1>
        <p className="text-stone-500 font-medium">{user?.email}</p>
        <div className="mt-3 inline-block px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold uppercase tracking-wider">
          Role: {user?.role}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-stone-900 mb-4 border-b border-stone-100 pb-2">Account Details</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-stone-500 text-sm font-bold">Member Since</span>
            <span className="text-stone-900 font-medium">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
          
          {user?.role === 'contributor' && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 text-sm font-bold">Reputation</span>
                <span className="text-[#B45309] font-black">{user?.reputation || 0}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
