import { Outlet } from 'react-router';
import SideBar from './SideBar';

const AuthenticatedLayout = () => {
    return (
        <div className="app-layout">
            <SideBar />
            <div className="main-content">
                <Outlet />
            </div>
        </div>
    );
};

export default AuthenticatedLayout;
