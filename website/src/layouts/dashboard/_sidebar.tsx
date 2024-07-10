'use client'
import cn from 'classnames';
import { ChevronForward } from "../../components/icons/chevron-forward";
import { useDrawer } from "../../components/drawer-views/context";
import Logo from "../../components/ui/logo";
import Button from "../../components/ui/button";
import { Close } from "../../components/icons/close";
import Scrollbar from "../../components/ui/scrollbar";
import { MenuItem } from "../../components/ui/collapsible-menu";

const routes = {
  gettingStarted: '/',
  accounts: '/accounts',
  faucets: '/faucets',
  notes: '/notes',
  transactions: '/transactions'
};

const menuItems = [
  {
    name: 'Getting Started',
    icon: <ChevronForward />,
    href: routes.gettingStarted,
  },
  {
    name: 'Wallets',
    icon: <ChevronForward />,
    href: routes.accounts,
  },
  {
    name: 'Faucets',
    icon: <ChevronForward />,
    href: routes.faucets,
  },
  {
    name: 'Transactions',
    icon: <ChevronForward />,
    href: routes.transactions,
  },
  {
    name: 'Notes',
    icon: <ChevronForward />,
    href: routes.notes,
  }
];

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { closeDrawer } = useDrawer();
  return (
    <aside
      className={cn(
        'top-0 z-40 h-full w-full max-w-full border-dashed border-gray-200 bg-body left-0 border-r dark:border-gray-700 dark:bg-dark xs:w-80 xl:fixed  xl:w-72 2xl:w-80',
        className
      )}
    >
      <div className="relative flex flex-col items-center justify-between px-6 py-4 2xl:px-8">
        <Logo />
        <div className="md:hidden">
          <Button
            title="Close"
            color="white"
            shape="circle"
            variant="transparent"
            size="small"
            onClick={closeDrawer}
          >
            <Close className="h-auto w-2.5" />
          </Button>
        </div>
      </div>

      <Scrollbar style={{ height: 'calc(100% - 96px)' }}>
        <div className="px-6 pb-5 2xl:px-8">
          <div className="mt-2">
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                name={item.name}
                href={item.href}
                icon={item.icon}
              />
            ))}
          </div>
        </div>
      </Scrollbar>
    </aside>
  );
}

// export default function Sidebar({ className }: SidebarProps) {
//   return (
//     <aside className='top-0 z-40 h-full w-full max-w-full border-dashed border-gray-200 bg-body ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l dark:border-gray-700 dark:bg-dark xs:w-80 xl:fixed  xl:w-72 2xl:w-80'>
//       <nav>
//         <ul>
//         <div className="px-6 pb-5 2xl:px-8">
//           <div className="mt-2">
//             {menuItems.map((item, index) => (
//               <li key={index}>
//                 <Link href={item.href}>{item.name}</Link>
//               </li>
//             ))}
//           </div>
//         </div>
//         </ul>
//       </nav>
//     </aside>
//   );
// }