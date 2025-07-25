/// <reference types='cypress' />

describe('Web Tables Page Functionality', () => {
  beforeEach(() => {
    cy.visit('https://demoqa.com/webtables');
    // Обробка неперехоплених винятків, щоб Cypress не падав
    Cypress.on('uncaught:exception', (_err, runnable) => { // Змінено err на _err
      // Повертаємо false, щоб Cypress не фейлив тест
      // через помилку в додатку, яка не стосується тесту.
      // Наприклад, якщо додаток сам викидає якісь помилки JavaScript.
      return false;
    });

    // Додаємо видалення всіх існуючих записів для чистого стану
    // Використовуємо .then() для синхронного виконання після перевірки body
    cy.get('body').then(($body) => {
      if ($body.find('[id^="delete-record"]').length > 0) {
        // Замість .each() і повторного пошуку, можна просто клікати по першому
        // доки він існує.
        // Замість cy.wait(100), чекаємо, поки елемент зникне, або таблиця оновиться.
        // Це виправить cypress/no-unnecessary-waiting
        cy.get('[id^="delete-record"]').each(() => {
          cy.get('[id^="delete-record"]').first().click();
          cy.get('.rt-tbody').should(($tbody) => {
            const noRowsFound = $tbody.find('.rt-noData').length > 0;
            const hasFewRows = $tbody.find('.rt-tr-group')
              .not('.rt-noData').length <= 2;
            return noRowsFound || hasFewRows;
          });
        });
      }
    });
    // Очікуємо, що таблиця стане порожньою (або покаже "No rows found")
    cy.get('.rt-noData').should('be.visible');
  });

  // Оновлена кастомна команда addEmployee
  Cypress.Commands.add('addEmployee', (
    firstName,
    lastName,
    email,
    age,
    salary,
    department
  ) => {
    cy.get('#addNewRecordButton').click();
    // Додаємо очікування, що форма з'явиться і поля стануть доступними
    cy.get('#firstName').should('be.visible').type(firstName);
    cy.get('#lastName').type(lastName);
    cy.get('#userEmail').type(email);
    cy.get('#age').type(age);
    cy.get('#salary').type(salary);
    cy.get('#department').type(department);
    cy.get('#submit').click();
    // Додаємо очікування, що модалка закриється
    cy.get('.modal-content').should('not.exist');
  });

  it('1.1 should navigate to the next page' +
    'using pagination after adding more entries',
  () => {
    // Змінюємо кількість рядків для активації пагінації
    cy.get('select[aria-label="rows per page"]').select('5');
    cy.get('select[aria-label="rows per page"]').should('have.value', '5');

    // Додаємо достатньо працівників, щоб було більше 5 записів
    // Наприклад, 3 існуючих + 3 нових = 6 записів. НІ, після очистки в beforeEach у нас 0.
    // Тому треба додати 6 записів, щоб було 6.
    cy.addEmployee('TestNext1', 'UserNext1', 'testnext1@example.com', '30',
      '12000', 'QA');
    cy.addEmployee('TestNext2', 'UserNext2', 'testnext2@example.com', '25',
      '10000', 'Dev');
    cy.addEmployee('TestNext3', 'UserNext3', 'testnext3@example.com', '35',
      '15000', 'HR');
    cy.addEmployee('TestNext4', 'UserNext4', 'testnext4@example.com', '28',
      '11000', 'Ops');
    cy.addEmployee('TestNext5', 'UserNext5', 'testnext5@example.com', '40',
      '18000', 'Sales');
    cy.addEmployee('TestNext6', 'UserNext6', 'testnext6@example.com', '22',
      '9000', 'Support');

    // Перевіряємо, що кнопка "Next" стала активною (тепер буде 6 записів,
    // а на сторінці 5)
    cy.get('div.-next button').should('not.be.disabled');

    // Натискаємо на кнопку "Next"
    cy.get('div.-next button').click();

    // Перевіряємо, що ми перейшли на наступну сторінку
    cy.get('div.-pageJump input').should('have.value', '2');
    cy.get('span.-totalPages').should('have.text', '2');
  });

  it('1.2 should navigate to the previous page using pagination', () => {
    // Повторюємо підготовку даних для цього тесту
    cy.get('select[aria-label="rows per page"]').select('5');
    cy.get('select[aria-label="rows per page"]').should('have.value', '5');

    // Додаємо достатньо працівників, щоб було більше 5 записів
    cy.addEmployee('TestPrev1', 'UserPrev1', 'testprev1@example.com', '30',
      '12000', 'QA');
    cy.addEmployee('TestPrev2', 'UserPrev2', 'testprev2@example.com', '25',
      '10000', 'Dev');
    cy.addEmployee('TestPrev3', 'UserPrev3', 'testprev3@example.com', '35',
      '15000', 'HR');
    cy.addEmployee('TestPrev4', 'UserPrev4', 'testprev4@example.com', '28',
      '11000', 'Ops');
    cy.addEmployee('TestPrev5', 'UserPrev5', 'testprev5@example.com', '40',
      '18000', 'Sales');
    cy.addEmployee('TestPrev6', 'UserPrev6', 'testprev6@example.com', '22',
      '9000', 'Support');

    // Переходимо на другу сторінку, щоб мати змогу повернутись назад
    cy.get('div.-next button').click();
    cy.get('div.-pageJump input').should('have.value', '2');

    // Переконаємось, що кнопка "Previous" активна
    cy.get('div.-previous button').should('not.be.disabled');

    // Натискаємо на кнопку "Previous"
    cy.get('div.-previous button').click();

    // Перевіряємо, що ми повернулись на першу сторінку
    cy.get('div.-pageJump input').should('have.value', '1');
  });

  // 2. Вибір кількості рядків (Rows count selection)
  it('2.1 should change the number of rows displayed per page', () => {
    // Додаємо достатньо працівників, щоб було більше, ніж 10 записів
    // (0 початкових + 11 доданих)
    for (let i = 1; i <= 11; i++) { // Додаємо 11 працівників
      cy.addEmployee(`TestRow${i}`, `UserRow${i}`, `testrow${i}@example.com`,
        `${20 + i}`, `${10000 + i * 100}`, `Dept${i}`);
    }

    // Перевіряємо, що за замовчуванням 10 рядків
    cy.get('select[aria-label="rows per page"]').should('have.value', '10');
    // Перевіряємо, що таблиця показує 10 АКТИВНИХ рядків (з кнопками редагування)
    cy.get('[id^="edit-record"]').should('have.length', 10);

    // Змінюємо кількість рядків на 20
    cy.get('select[aria-label="rows per page"]').select('20');
    cy.get('select[aria-label="rows per page"]').should('have.value', '20');
    // Перевіряємо, що тепер показано всі 11 активних записів
    cy.get('[id^="edit-record"]').should('have.length', 11);

    // Змінюємо кількість рядків на 5
    cy.get('select[aria-label="rows per page"]').select('5');
    cy.get('select[aria-label="rows per page"]').should('have.value', '5');
    // Перевіряємо, що показано 5 активних записів
    cy.get('[id^="edit-record"]').should('have.length', 5);
    // І що пагінація активна
    cy.get('div.-next button').should('not.be.disabled');
  });

  // 3. Додати нового працівника (Add a new worker)
  it('3.1 should add a new worker to the table', () => {
    const newWorker = {
      firstName: 'New',
      lastName: 'Worker',
      email: 'newworker@example.com',
      age: '40',
      salary: '25000',
      department: 'IT'
    };

    // Ми припускаємо, що таблиця порожня (через beforeEach)
    // Повинно бути 0 записів на старті
    cy.get('[id^="edit-record"]').should('have.length', 0);

    // Додаємо нового працівника за допомогою кастомної команди
    cy.addEmployee(newWorker.firstName, newWorker.lastName, newWorker.email,
      newWorker.age, newWorker.salary, newWorker.department);

    // Перевіряємо, що кількість "активних" рядків збільшилась на 1 (стало 1)
    cy.get('[id^="edit-record"]').should('have.length', 1);

    // Перевіряємо, що новий працівник з'явився в таблиці
    cy.contains('.rt-tbody .rt-tr-group', newWorker.firstName).should('exist');
    cy.contains('.rt-tbody .rt-tr-group', newWorker.email).should('exist');
  });

  // 4. Видалити працівника (Delete a worker)
  it('4.1 should delete a specific worker from the table', () => {
    // Додаємо тестового працівника для видалення
    const workerToDelete = {
      firstName: 'Delete',
      lastName: 'Me',
      email: 'deleteme@example.com',
      age: '99',
      salary: '1',
      department: 'None'
    };
    cy.addEmployee(workerToDelete.firstName, workerToDelete.lastName,
      workerToDelete.email, workerToDelete.age,
      workerToDelete.salary, workerToDelete.department);

    // Перевіряємо, що працівник існує перед видаленням
    cy.contains('.rt-tbody .rt-tr-group', workerToDelete.firstName)
      .should('exist');

    // Знаходимо рядок з цим працівником і натискаємо кнопку видалення
    cy.contains('.rt-tbody .rt-tr-group', workerToDelete.firstName)
      .find('[id^="delete-record"]').click();

    // Перевіряємо, що працівник зник з таблиці
    cy.contains('.rt-tbody .rt-tr-group', workerToDelete.firstName)
      .should('not.exist');
  });

  // 5. Видалити всіх працівників (Delete all workers)
  it('5.1 should delete all workers from the table', () => {
    // Додаємо декілька працівників, щоб було що видаляти
    cy.addEmployee(
      'DelAll1', 'User1', 'delall1@example.com', '20', '5000', 'A'
    );
    cy.addEmployee(
      'DelAll2', 'User2', 'delall2@example.com', '21', '6000', 'B'
    );
    cy.addEmployee(
      'DelAll3', 'User3', 'delall3@example.com', '22', '7000', 'C'
    );

    // Перевіряємо, що в таблиці є записи
    cy.get('.rt-tbody .rt-tr-group').not('.rt-noData')
      .should('have.length.of.at.least', 3);

    // На цій сторінці (demoqa.com) видалення всіх працівників робить їхні рядки порожніми,
    // а не видаляє рядки повністю. Тому перевірятимемо, що в таблиці немає "реальних" даних.
    // Зазвичай, є 3 початкові записи, які можна видалити.
    // Щоб видалити всі, ми клікаємо на іконку видалення, поки вони є.
    // Видаляємо всі записи, що мають кнопку видалення
    cy.get('body').then(($body) => {
      let deleteButtonsCount = $body.find('[id^="delete-record"]')
        .length;
      while (deleteButtonsCount > 0) {
        cy.get('[id^="delete-record"]').first().click();
        // Після кліку чекаємо, поки DOM оновиться або елемент зникне
        cy.get('body').then(($bodyAfterClick) => {
          deleteButtonsCount = $bodyAfterClick.find('[id^="delete-record"]')
            .length;
        });
      }
    });

    // Після видалення всіх, у таблиці можуть залишитися порожні рядки (плейсхолдери)
    // Перевіряємо, що немає жодного запису, який не є порожнім
    cy.get('.rt-tbody .rt-tr-group').each(($row) => {
      // Перевіряємо, що всі клітинки в рядку порожні або містять &nbsp;
      cy.wrap($row).find('.rt-td').each(($cell) => {
        cy.wrap($cell).invoke('text').then((text) => {
          expect(text.trim()).to.be.oneOf(['', '\u00A0']); // '' для порожнього, '\u00A0' для &nbsp;
        });
      });
    });
    // Також, якщо з'являється "No rows found"
    cy.get('.rt-noData').should('be.visible');
  });

  // 6. Знайти працівника в полі пошуку та відредагувати його
  // 7. Перевірити дані в працівника після його редагування
  it('6.1 & 7.1 should find and edit a worker, then validate the updated data',
    () => {
      const originalWorker = {
        firstName: 'EditMe',
        lastName: 'Please',
        email: 'editme@example.com',
        age: '50',
        salary: '50000',
        department: 'OldDept'
      };
      const updatedWorker = {
        firstName: 'Edited',
        lastName: 'Worker',
        email: 'edited@example.com',
        age: '55',
        salary: '60000',
        department: 'NewDept'
      };

      // Додаємо працівника для редагування
      cy.addEmployee(originalWorker.firstName, originalWorker.lastName,
        originalWorker.email, originalWorker.age, originalWorker.salary,
        originalWorker.department);

      // 6.1 Знаходимо працівника в полі пошуку
      cy.get('#searchBox').type(originalWorker.firstName);
      // Перевіряємо, що в таблиці залишився тільки цей працівник
      cy.get('[id^="edit-record"]').should('have.length', 1);
      // Переконаємось, що унікальний користувач існує в таблиці
      cy.get('.rt-tbody .rt-tr-group').contains(originalWorker.firstName)
        .should('exist'); // Поправлено тут

      // Натискаємо кнопку редагування
      cy.get('[id^="edit-record"]').first().click();

      // Редагуємо поля форми
      cy.get('#firstName').clear();
      cy.get('#firstName').type(updatedWorker.firstName);

      cy.get('#lastName').clear();
      cy.get('#lastName').type(updatedWorker.lastName);

      cy.get('#userEmail').clear();
      cy.get('#userEmail').type(updatedWorker.email);

      cy.get('#age').clear();
      cy.get('#age').type(updatedWorker.age);

      cy.get('#salary').clear();
      cy.get('#salary').type(updatedWorker.salary);

      cy.get('#department').clear();
      cy.get('#department').type(updatedWorker.department);

      cy.get('#submit').click();

      // Очищаємо пошук, щоб бачити всі записи після оновлення
      cy.get('#searchBox').clear();

      // 7.1 Перевіряємо дані після редагування
      // Перевіряємо, що старі дані зникли
      cy.get('.rt-tbody .rt-tr-group').contains(originalWorker.firstName)
        .should('not.exist');
      cy.get('.rt-tbody .rt-tr-group').contains(originalWorker.email)
        .should('not.exist');

      // Перевіряємо, що нові дані з'явилися в таблиці
      // Розділяємо ланцюжки команд для cypress/unsafe-to-chain-command
      cy.get('.rt-tbody .rt-tr-group').contains(updatedWorker.firstName)
        .should('exist');
      cy.get('.rt-tbody .rt-tr-group').contains(updatedWorker.lastName)
        .should('exist');
      cy.get('.rt-tbody .rt-tr-group').contains(updatedWorker.email)
        .should('exist');
      cy.get('.rt-tbody .rt-tr-group').contains(updatedWorker.age)
        .should('exist');
      cy.get('.rt-tbody .rt-tr-group').contains(updatedWorker.salary)
        .should('exist');
      cy.get('.rt-tbody .rt-tr-group').contains(updatedWorker.department)
        .should('exist');
    });

  // 8.1 should filter table by searching all column values
  it('8.1 should filter table by searching all column values', () => {
    // Додаємо тестові дані для пошуку
    cy.addEmployee('UniqueSearchUser', 'UniqueLast', 'unique@test.com', '45',
      '75000', 'Marketing');
    cy.addEmployee('Another', 'Person', 'another@test.com', '22',
      '30000', 'Sales');

    const searchTerms = [
      'UniqueSearchUser',
      'UniqueLast',
      'unique@test.com',
      '45',
      '75000',
      'Marketing'
    ];

    searchTerms.forEach((term) => {
      cy.get('#searchBox').clear(); // Очищаємо поле
      cy.get('#searchBox').type(term); // Потім вводимо текст

      // Перевіряємо, що в таблиці 1 активний запис
      cy.get('[id^="edit-record"]').should('have.length', 1);
      // Перевіряємо, що саме наш унікальний користувач там
      cy.get('.rt-tbody .rt-tr-group').contains('UniqueSearchUser')
        .should('exist'); // Поправлено тут
      // Перевіряємо, що інший працівник (Another Person) відсутній
      cy.get('.rt-tbody .rt-tr-group').contains('Another')
        .should('not.exist');
    });

    // Очищаємо пошук після всіх перевірок
    cy.get('#searchBox').clear();
    // Перевіряємо, що всі записи знову видно (ті 2, що були додані в цьому тесті)
    cy.get('[id^="edit-record"]').should('have.length', 2);
  });
});
