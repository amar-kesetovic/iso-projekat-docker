export const Header = ({ onLogout }: { onLogout: () => void }) => (
  <header className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
    <h1 className="text-xl font-bold">Student Management</h1>
    <button
      onClick={onLogout}
      className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
    >
      Logout
    </button>
  </header>
);
