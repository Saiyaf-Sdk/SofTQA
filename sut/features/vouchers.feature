Feature: Voucher feedback in the shopping bag
  A shopper should be able to see the change in their total before sign-in.

  Background:
    Given I have one CK One in my guest bag at $84.00

  Scenario: BDD-01 Apply the VIP merchandise discount
    When I apply the voucher " vip15 "
    Then the order summary shows "15% VIP Discount Applied"
    And the total is "$86.10"

  Scenario: BDD-02 Apply complimentary delivery
    When I apply the voucher "CONCIERGE"
    Then the order summary shows "Complimentary Express Courier Applied"
    And the total is "$90.72"
