import Image from "next/image";
import Header from "./Header";

export default function Home() {
  return (
    <main>
      <section>
      <div>
      <Header />
      <main className="mainHeader">
        {/* Your main content goes here */}
        
      </main>
    </div>
      </section>
      <section>
      <div className="about_platform">
        <h1>De ce?</h1>

      </div>

      <div className="account_box">

        <h1>Login Section</h1>
       </div> 
      </section>
       
    </main>
     

     
   

  );
}
