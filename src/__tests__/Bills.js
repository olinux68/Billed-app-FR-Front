/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from '../containers/Bills'
import router from "../app/Router.js";

describe('Given I am connected as an employee', () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Setup localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      // Wait for the icon to be in the document
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      // Test if the icon is highlighted
      expect(windowIcon.classList.contains('active-icon')).toBe(true);
    })

    test("Then bills should be ordered from earliest to latest", () => {
      // Setup the Bills UI
      document.body.innerHTML = BillsUI({ data: bills })
      // Get the dates from the document
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      // Sort dates for comparison
      const datesSorted = [...dates].sort(antiChrono)
      // Check if dates are sorted correctly
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe('Bills', () => {
  // Définir mockBills dans la portée du describe pour qu'il soit accessible dans les fonctions beforeEach et it
  const mockBills = [{ id: 1, amount: 10 }, { id: 2, amount: 20 }];
  let billsInstance;

  beforeEach(() => {
    // Configurer le DOM virtuel pour le test
    document.body.innerHTML = `
      <div id="root">
        <div data-testid="bills-container"></div>
        <!-- Ajoutez ici tout autre élément HTML nécessaire pour votre composant Bills -->
      </div>
    `;

    // Créer une nouvelle instance de Bills avec les objets simulés
    billsInstance = new Bills({
      document,
      onNavigate: () => { }, // Fonction simulée pour onNavigate
      store: {
        bills: () => ({
          list: () => Promise.resolve(mockBills), // Retourner les mockBills comme une promesse résolue
        })
      },
      localStorage: window.localStorage // Simuler le localStorage
    });

    // Simuler la fonction fetch globale
    global.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve(mockBills),
    }));
  });

  describe('Fetching data', () => {
    it('should fetch bills and update the state', async () => {
      // Exécuter la fonction getBills pour obtenir les factures
      const bills = await billsInstance.getBills();

      // S'assurer que la fonction getBills retourne les factures attendues
      expect(bills).toEqual(mockBills); // Ici, mockBills est accessible et utilisé pour l'assertion
    });
  });

  afterEach(() => {
    // Nettoyer le DOM et réinitialiser les mocks après chaque test
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });
});



describe('Bills', () => {
  // Créez un objet mock pour simuler les dépendances nécessaires
  const mockDocument = document;
  const mockOnNavigate = jest.fn();
  const mockStore = {
    bills: jest.fn(() => ({
      list: jest.fn(() => Promise.resolve([])),
    })),
  };
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };

  // Créez une instance de la classe Bills en utilisant les objets mock
  const billsInstance = new Bills({
    document: mockDocument,
    onNavigate: mockOnNavigate,
    store: mockStore,
    localStorage: mockLocalStorage,
  });

  // Testez la méthode handleClickNewBill
  it('should navigate to NewBill page when handleClickNewBill is called', () => {
    billsInstance.handleClickNewBill();
    expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
  });



});
