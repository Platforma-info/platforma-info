import { Container } from "postcss";

// Header.tsx
const Header = () => {
  return (
    <header className="bg-[#aaffe5] mainHeader">
      <div className="container w-10 h-16 bg-blue-700">
        Icon place
      </div>
      <div className="container mx-auto text-center text">

        <nav className="nav_bar flex justify-between w-full flex-wrap">

          <ul className="flex space-x-2">
            <li>
              <a href="#" className="text-gray-800 p-3 rounded interactive_box">
                cv1
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-800 p-3 rounded interactive_box">
                cv2
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-800 p-3 rounded interactive_box">
                cv3
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-800 p-3 rounded interactive_box">
                Documentatie
              </a>
            </li>
          </ul>


          <ul className="flex space-x-4">
            <li>
              <a href="#" className="text-gray-800 p-3 rounded interactive_box">
                Probleme
              </a>

            </li>
            <li>
              <a href="#" className="text-gray-800 p-3 rounded interactive_box">
                ContulMeu/Ingregistreaza-te;
              </a>
            </li>
            <li>
              
            <input
              type="text"
              placeholder="Cauta problema..."
              className="flex-grow p-2 text-gray-700"
            />
            <button className="p-2 bg-blue-500 text-white rounded-lg ml-2 hover:bg-blue-600">
              Search
            </button>
            </li>
          </ul>
        </nav>

      </div>
    </header>
  );
};

export default Header;