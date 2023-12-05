import React, { useState } from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import { Link } from 'react-router-dom'; // Make sure this import is correct

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button 
                onClick={() => setIsOpen(!isOpen)} 
                className="menu-button" 
                aria-controls="basic-navbar-nav"
            >
                ☰
            </Button>

            <Navbar bg="light" className={`flex-column sidebar ${isOpen ? 'open' : 'closed'}`}>
                <Nav defaultActiveKey="/home" className="flex-column">
                    {/* Using 'Link' component for client-side navigation */}
                    <Link to="/" className="nav-link">Consumos</Link> {/* This line is updated */}
                    <Link to="/regulados" className="nav-link">Regulados</Link>
                    <Link to="/potencia" className="nav-link">Potencia</Link>
                    <Link to="/WMAPE" className="nav-link">WMAPE</Link>
                    <Link to="/factura" className="nav-link">Factura</Link>
                    {/* other links... */}
                </Nav>
            </Navbar>

            <div>
           
            </div>
        </>
    );
};

export default Sidebar;
