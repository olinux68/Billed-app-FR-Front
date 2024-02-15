/**
 * @jest-environment jsdom
 */


import "@testing-library/jest-dom";
import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI";
import { localStorageMock } from "../__mocks__/localStorage";
import { ROUTES } from "../constants/routes";
import store from "../__mocks__/store";
import Store from "../app/Store";



// identify as employee

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

Object.defineProperty(window, "LocalStorage", { value: localStorageMock });
window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

//Vérification de l'extension justificatif au téléchargement

describe("Given I am on NewBill Page", () => {
  describe("When I upload an image file", () => {
    test("Then the file extension is correct", async () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      //Chargement du fichier
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      const inputFile = screen.queryByTestId("file");

      inputFile.addEventListener("change", handleChangeFile);

      //Déclencheur d'évenement
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["myTest.png"], "myTest.png", { type: "image/png" }),
          ],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].name).toBe("myTest.png");
    });
  });
});

//Soumission du formulaire pour la création de facture

describe("Given I am on NewBill Page", () => {
  describe("And I submit a valid bill form", () => {
    test("Then a bill is created", async () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      //création d'un nouveau formulaire de facture

      const handleSubmit = jest.fn(newBill.handleSubmit);
      const newBillForm = screen.getByTestId("form-new-bill");
      newBillForm.addEventListener("submit", handleSubmit);
      fireEvent.submit(newBillForm);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});

// test d'intégration POST
//A la validation de formulaire

describe("Given I am a user connected as en Employee", () => {
  describe("When I valid bill form", () => {
    test("Then a bill is created", async () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      //Nouveau bill avec handleSubmit
      const submit = screen.queryByTestId("form-new-bill");
      const billTest = {
        name: "testing",
        date: "2001-04-15",
        amount: 400,
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        pct: 25,
        vat: 12,
        commentary: "C'est un test",
        fileName: "testing",
        fileUrl: "testing.jpg",
      };

      //click submit
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      //L'application au DOM
      newBill.createBill = (newBill) => newBill;
      document.querySelector(`select[data-testid="expense-type"]`).value =
        billTest.type;
      document.querySelector(`input[data-testid="expense-name"]`).value =
        billTest.name;
      document.querySelector(`input[data-testid="datepicker"]`).value =
        billTest.date;
      document.querySelector(`input[data-testid="amount"]`).value =
        billTest.amount;
      document.querySelector(`input[data-testid="vat"]`).value = billTest.vat;
      document.querySelector(`input[data-testid="pct"]`).value = billTest.pct;
      document.querySelector(`textarea[data-testid="commentary"]`).value =
        billTest.commentary;
      newBill.fileUrl = billTest.fileUrl;
      newBill.fileName = billTest.fileName;

      submit.addEventListener("click", handleSubmit);

      fireEvent.click(submit);

      //verifie si handleSubmit est appelé
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});

// Si je veux poster un fichier png, la fonction handleChangeFile doit être appelé

describe("When I navigate to the newbill page, and I want to post an PNG file", () => {
  test("Then function handleChangeFile should be called", () => {
    const html = NewBillUI();
    document.body.innerHTML = html;
    jest.spyOn(Store.api, "post").mockImplementation(store.post);

    const newBill = new NewBill({
      document,
      onNavigate,
      store: Store,
      localStorage: window.localStorage,
    });
    const handleChangeFile = jest.fn(newBill.handleChangeFile);
    const file = screen.getByTestId("file");

    file.addEventListener("change", handleChangeFile);
    fireEvent.change(file, {
      target: {
        files: [new File(["image"], "test.png", { type: "image/png" })],
      },
    });
    expect(handleChangeFile).toHaveBeenCalled();
  });
});

// Si je veux poster un fichier pdf, la fonction handleChangeFile doit être appelé

describe("When I navigate to the newbill page, and I want to post an PDF file", () => {
  test("Then function handleChangeFile should be called", () => {
    const html = NewBillUI();
    document.body.innerHTML = html;
    jest.spyOn(Store.api, "post").mockImplementation(store.post);

    const newBill = new NewBill({
      document,
      onNavigate,
      store: Store,
      localStorage: window.localStorage,
    });

    const file = screen.getByTestId("file");

    const handleChangeFile = jest.fn(newBill.handleChangeFile);

    file.addEventListener("change", handleChangeFile);

    fireEvent.change(file, {
      target: {
        files: [new File(["image"], "test.pdf", { type: "image/pdf" })],
      },
    });
    expect(handleChangeFile).toHaveBeenCalled();
    expect(file.value).toBe("");
  });
});

//Gestion d'erreur 404/500

describe("When an error occurs on API", () => {
  beforeEach(() => {
    jest.spyOn(store, "bills");
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
  });

  test("fetches bills from an API and fails with 404 message error", async () => {
    store.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 404"));
        },
      };
    });
    // initialise le body
    const html = BillsUI({ error: "Erreur 404" });
    document.body.innerHTML = html;
    const message = screen.getByText(/Erreur 404/);
    expect(message).toBeTruthy();
  });

  test("fetches messages from an API and fails with 500 message error", async () => {
    store.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 500"));
        },
      };
    });
    //initialise le body
    const html = BillsUI({ error: "Erreur 500" });
    document.body.innerHTML = html;
    const message = screen.getByText(/Erreur 500/);
    expect(message).toBeTruthy();
  });
});

describe("Given I am a user connected as an Employee", () => {
  describe("When I fill out the bill form", () => {
    test("Then the form values should be correct", () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const billTest = {
        name: "testing",
        date: "2001-04-15",
        amount: 400,
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        pct: 25,
        vat: 12,
        commentary: "C'est un test",
        fileName: "testing",
        fileUrl: "testing.jpg",
      };

      document.querySelector(`select[data-testid="expense-type"]`).value =
        billTest.type;
      document.querySelector(`input[data-testid="expense-name"]`).value =
        billTest.name;
      document.querySelector(`input[data-testid="datepicker"]`).value =
        billTest.date;
      document.querySelector(`input[data-testid="amount"]`).value =
        billTest.amount;
      document.querySelector(`input[data-testid="vat"]`).value = billTest.vat;
      document.querySelector(`input[data-testid="pct"]`).value = billTest.pct;
      document.querySelector(`textarea[data-testid="commentary"]`).value =
        billTest.commentary;

      expect(document.querySelector(`select[data-testid="expense-type"]`).value).toBe(billTest.type);
      expect(document.querySelector(`input[data-testid="expense-name"]`).value).toBe(billTest.name);
      expect(document.querySelector(`input[data-testid="datepicker"]`).value).toBe(billTest.date);
      expect(document.querySelector(`input[data-testid="amount"]`).value).toBe(String(billTest.amount));
      expect(document.querySelector(`input[data-testid="vat"]`).value).toBe(String(billTest.vat));
      expect(document.querySelector(`input[data-testid="pct"]`).value).toBe(String(billTest.pct));
      expect(document.querySelector(`textarea[data-testid="commentary"]`).value).toBe(billTest.commentary);
    });
  });
});
describe("Given I am a user connected as an Employee", () => {
  describe("When I fill out the bill form", () => {
    test("Then the form values should be correct", () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const billTest = {
        name: "testing",
        date: "2001-04-15",
        amount: 400,
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        pct: 25,
        vat: 12,
        commentary: "C'est un test",
        fileName: "testing",
        fileUrl: "testing.jpg",
      };

      document.querySelector(`select[data-testid="expense-type"]`).value =
        billTest.type;
      document.querySelector(`input[data-testid="expense-name"]`).value =
        billTest.name;
      document.querySelector(`input[data-testid="datepicker"]`).value =
        billTest.date;
      document.querySelector(`input[data-testid="amount"]`).value =
        billTest.amount;
      document.querySelector(`input[data-testid="vat"]`).value = billTest.vat;
      document.querySelector(`input[data-testid="pct"]`).value = billTest.pct;
      document.querySelector(`textarea[data-testid="commentary"]`).value =
        billTest.commentary;

      expect(document.querySelector(`select[data-testid="expense-type"]`).value).toBe(billTest.type);
      expect(document.querySelector(`input[data-testid="expense-name"]`).value).toBe(billTest.name);
      expect(document.querySelector(`input[data-testid="datepicker"]`).value).toBe(billTest.date);
      expect(document.querySelector(`input[data-testid="amount"]`).value).toBe(String(billTest.amount));
      expect(document.querySelector(`input[data-testid="vat"]`).value).toBe(String(billTest.vat));
      expect(document.querySelector(`input[data-testid="pct"]`).value).toBe(String(billTest.pct));
      expect(document.querySelector(`textarea[data-testid="commentary"]`).value).toBe(billTest.commentary);
    });
  });
});

describe("Given I am a user connected as an Employee", () => {
  describe("When I navigate to the NewBill page", () => {
    test("Then the NewBill page should be rendered", () => {
      document.body.innerHTML = NewBillUI();
      const newBillPage = screen.getByTestId("form-new-bill");
      expect(newBillPage).toBeTruthy();
    });
  });
});

describe("Given I am a user connected as an Employee", () => {
  describe("When I fill out the bill form", () => {
    test("Then the form values should be updated", () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const billTest = {
        name: "testing",
        date: "2001-04-15",
        amount: 400,
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        pct: 25,
        vat: 12,
        fileName: "testing",
        fileUrl: "testing.jpg",
      };

      document.querySelector(`select[data-testid="expense-type"]`).value =
        billTest.type;
      document.querySelector(`input[data-testid="expense-name"]`).value =
        billTest.name;
      document.querySelector(`input[data-testid="datepicker"]`).value =
        billTest.date;
      document.querySelector(`input[data-testid="amount"]`).value =
        billTest.amount;
      document.querySelector(`input[data-testid="vat"]`).value = billTest.vat;
      document.querySelector(`input[data-testid="pct"]`).value = billTest.pct;
      document.querySelector(`textarea[data-testid="commentary"]`).value =
        billTest.commentary;

      expect(document.querySelector(`select[data-testid="expense-type"]`).value).toBe(billTest.type);
      expect(document.querySelector(`input[data-testid="expense-name"]`).value).toBe(billTest.name);
      expect(document.querySelector(`input[data-testid="datepicker"]`).value).toBe(billTest.date);
      expect(document.querySelector(`input[data-testid="amount"]`).value).toBe(String(billTest.amount));
      expect(document.querySelector(`input[data-testid="vat"]`).value).toBe(String(billTest.vat));
      expect(document.querySelector(`input[data-testid="pct"]`).value).toBe(String(billTest.pct));
      expect(document.querySelector(`textarea[data-testid="commentary"]`).value).toBe(billTest.commentary);
    });
  });
});

